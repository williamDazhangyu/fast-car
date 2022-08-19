import { BootPriority, ComponentKind, FastCarApplication, Logger } from "fastcar-core";
import { ApplicationStart, ApplicationStop, Autowired, Log } from "fastcar-core/annotation";
import {
	Middleware,
	RpcMessage,
	RpcContext,
	MethodType,
	RpcUrl,
	RpcNotiyMessage,
	RpcServerMsgBox,
	RpcServerRequestType,
	RpcFailMsgQueue,
	RpcConfig,
	InteractiveMode,
	RetryConfig,
	RpcResponseType,
	RpcResponseCode,
} from "../../types/RpcConfig";
import { ClientSession, SessionId } from "../../types/SocketConfig";
import ComposeService from "../ComposeService";
import SocketManager from "../socket/SocketManager";
import TaskAsync from "../../model/TaskAsync";
import { EnableScheduling, ScheduledInterval } from "fastcar-timer";
import { RpcMetaData } from "../../constant/RpcMetaData";
import { RpcUrlData } from "../../constant/RpcUrlData";
import MsgCallbackService from "../MsgCallbackService";
import RpcAuthService from "../RpcAuthService";
import { SocketMsgStatus } from "../../constant/SocketMsgStatus";
import RPCErrorService from "../RPCErrorService";
import { ProtoMeta } from "../../types/PBConfig";
import ProtoBuffService from "../ProtoBuffService";

//rpc 管理服务 用于和客户端进行同步异步消息发送
@ApplicationStart(BootPriority.Lowest * 10, "start") //落后于koa执行
@ApplicationStop(BootPriority.Base, "stop")
@EnableScheduling
export default class RpcServer implements MsgCallbackService {
	@Autowired
	protected app!: FastCarApplication;
	@Log("rpc")
	private rpcLogger!: Logger;

	protected socketManager: SocketManager; //socket管理
	protected middleware: Middleware[]; //压缩后的组件方法
	protected composeMiddleware!: (context: RpcContext) => void;
	protected rcpRouterMap: Map<RpcUrl, Function>;
	protected msgQueue: Map<number, RpcServerMsgBox>; //序列号 消息队列
	protected serialId: number;
	protected rpcConfig: RpcConfig;
	protected failMsgQueue: RpcFailMsgQueue[];
	protected checkStatus: boolean;

	constructor() {
		this.middleware = [];
		this.rcpRouterMap = new Map();
		this.socketManager = new SocketManager();
		this.msgQueue = new Map();
		this.serialId = 0;
		this.rpcConfig = {
			list: [],
			retry: {
				retryCount: 3, //错误重试次数 默认三次
				retryInterval: 100, //重试间隔 默认一秒
				maxMsgNum: 10000, //最大消息并发数
				timeout: 3000,
			},
		};
		this.failMsgQueue = [];
		this.checkStatus = false;
	}

	//序列号递增
	protected addSerialId(): number {
		let rpcRetryPolicyConfig = this.rpcConfig.retry;
		if (this.msgQueue.size >= rpcRetryPolicyConfig.maxMsgNum) {
			return -1;
		}

		for (let i = 1; i < rpcRetryPolicyConfig.maxMsgNum; i++) {
			if (this.serialId >= rpcRetryPolicyConfig.maxMsgNum) {
				this.serialId = 1;
			} else {
				this.serialId++;
			}
			if (!this.msgQueue.has(this.serialId)) {
				return this.serialId;
			}
		}

		return -1;
	}

	//封装请求 做出回应
	response(): Middleware {
		return async (context: RpcContext, next?: Function) => {
			let result: RpcServerRequestType = {
				sessionId: context.sessionId,
				msg: { id: context.id, url: context.url, mode: InteractiveMode.response },
			};

			try {
				if (next) {
					await next();
				}

				let res = context.body;
				if (!res) {
					result.msg.data = {
						code: RpcResponseCode.notfound,
						msg: "not found",
					};
				} else {
					result.msg.data = res;
				}
			} catch (e) {
				this.rpcLogger.error(`${context.url} is error`);
				this.rpcLogger.error(e);
				result.msg.data = {
					code: RpcResponseCode.error,
					msg: "Server internal error",
				};
			} finally {
				if (context.url == RpcUrlData.disconnect) {
					//断线了就不发消息了
					return;
				}
				this.sendMsgBySessionId(result);
			}
		};
	}

	/***
	 * @version 1.0 加载路由
	 *
	 */
	protected loadRoute(): Middleware | null {
		let instanceList = this.app.getComponentByType(ComponentKind.Controller);

		//查找绑定的url
		instanceList.forEach((instance) => {
			let routerMap: Map<RpcUrl, MethodType> = Reflect.getMetadata(RpcMetaData.RPCMethod, instance);
			if (!routerMap || routerMap.size == 0) {
				return;
			}

			//绑定具体的protobuff协议
			let protoMeta: ProtoMeta = Reflect.getMetadata(RpcMetaData.ProtoDataConfig, instance);

			routerMap.forEach((item, url) => {
				const callBack = async (ctx: RpcContext) => {
					let data = ctx.data || {};

					let res = await instance[item.method](data, ctx);
					if (!!res) {
						ctx.body = res;
					}
				};

				this.rcpRouterMap.set(url, callBack);

				if (!!protoMeta) {
					ProtoBuffService.addUrlMapping({
						url,
						protoPath: protoMeta.protoPath,
						service: protoMeta.service,
						method: item.method,
					});
				}
			});
		});

		if (this.rcpRouterMap.size == 0) {
			return null;
		}

		//构造一个中间件查找路由
		return async (ctx: RpcContext, next?: Function) => {
			if (!ctx.url) {
				if (next) {
					next();
				}

				return;
			}

			let cb = this.rcpRouterMap.get(ctx.url);
			if (!cb) {
				if (next) {
					next();
				}
				return;
			}

			await Promise.resolve(Reflect.apply(cb, this, [ctx]));

			if (next) {
				next();
			}
		};
	}

	connect(session: ClientSession): void {
		//传递调用
		this.handleMsg(session, {
			url: RpcUrlData.connect, //路由
			data: session,
			mode: InteractiveMode.request,
		});
	}

	async auth(username: string, password: string, session: ClientSession): Promise<boolean> {
		let config = this.socketManager.getSocketServerConfig(session.serverId);
		if (!config) {
			return false;
		}

		let service: RpcAuthService = this.app.getComponentByName(RpcMetaData.RPCAuthService);
		if (!service) {
			if (!config.secure?.password || !config.secure.username) {
				return true;
			}

			return config.secure.password === password && config.secure.username === username;
		}

		return await service.auth(username, password, config);
	}

	disconnect(session: ClientSession, reason: string): void {
		this.handleMsg(session, {
			url: RpcUrlData.disconnect, //路由
			data: { session, reason },
			mode: InteractiveMode.request,
		});
	}

	handleMsg(session: ClientSession, msg: RpcMessage): void {
		//如果为应答模式
		if (msg.mode == InteractiveMode.response) {
			if (msg.id) {
				let item = this.msgQueue.get(msg.id);
				if (item) {
					let cb = item.cb;
					if (cb) {
						cb.done(null, msg);
						this.msgQueue.delete(msg.id);
					}
				}
			}
			return;
		}
		let ctx = Object.assign({}, msg, session);
		//调用绑定的组件
		this.composeMiddleware(ctx);
	}

	public getSocketManager() {
		return this.socketManager;
	}

	//给单个会话发送消息
	protected async sendMsgBySessionId(m: RpcServerRequestType): Promise<void> {
		let flag = await this.socketManager.sendMsg(m.sessionId, m.msg);
		if (flag == SocketMsgStatus.fail) {
			let retry = this.rpcConfig.retry;
			let timeout = m.timeout || retry.timeout;
			//放入至失败的消息队列中进行处理
			this.pushFailMsg({
				sessionId: m.sessionId,
				msg: m.msg,
				retryCount: 0,
				retryInterval: m.retryInterval || retry.retryInterval,
				expiretime: Date.now() + timeout,
				timeout: timeout,
				maxRetryCount: m.retryCount || retry.retryCount,
				maxRetryInterval: m.retryInterval || retry.retryInterval,
			});
		}
	}

	//重试消息
	protected async retrySendMsg(m: RpcFailMsgQueue): Promise<SocketMsgStatus> {
		let flag = await this.socketManager.sendMsg(m.sessionId, m.msg);

		return flag;
	}

	protected pushFailMsg(m: RpcFailMsgQueue) {
		if (this.failMsgQueue.length >= this.rpcConfig.retry.maxMsgNum) {
			//将之前的抛出
			let item = this.failMsgQueue.shift();
			if (item) {
				this.rpcLogger.error("The message queue is too long and is discarded");
				this.rpcLogger.error(item.msg);
			}
		}

		this.failMsgQueue.push(m);
	}

	/***
	 * @version 1.0 异步通知消息 不保证客户端一定能收到消息
	 *
	 */
	protected notifyMessage(msg: RpcNotiyMessage) {
		if (msg.channel) {
			this.socketManager.sendMsgByChannel(
				msg.channel,
				{
					url: msg.url,
					data: msg.data,
					mode: InteractiveMode.notify,
				},
				msg.excludeIds
			);
		} else if (msg.sessionId) {
			this.sendMsgBySessionId({
				sessionId: msg.sessionId,
				msg: {
					url: msg.url,
					data: msg.data,
					mode: InteractiveMode.notify,
				},
			});
		}
	}

	/***
	 * @version 1.0 向客户端发起请求
	 * @params  sessionId 会话id
	 * @params  data 发起的数据
	 * @params timeout 超时后返回 默认3s
	 *
	 */
	public async request(sessionId: SessionId, url: string, data?: Object, opts?: RetryConfig): Promise<RpcResponseType> {
		return new Promise((resolve) => {
			if (!this.socketManager.sessionOnline(sessionId)) {
				resolve({ code: RpcResponseCode.disconnect, msg: "socket is disconnect" });
				return;
			}

			let id = this.addSerialId();
			if (id == -1) {
				resolve({ code: RpcResponseCode.busy, msg: "The message number has been used up" });
				return;
			}

			let timeout = opts?.timeout || this.rpcConfig.retry.timeout;
			let r: RpcServerRequestType = {
				sessionId,
				msg: {
					id,
					url,
					data,
					mode: InteractiveMode.request,
				},
				retryCount: opts?.retryCount || this.rpcConfig.retry.retryCount,
				retryInterval: opts?.retryInterval || this.rpcConfig.retry.retryInterval,
				timeout: timeout,
			};

			let cb = new TaskAsync((err: RpcResponseType | null, res: RpcMessage) => {
				err ? resolve(err) : resolve({ code: RpcResponseCode.ok, data: res.data });
			});

			let m: RpcServerMsgBox = {
				id,
				cb,
				timeout: timeout,
				expiretime: Date.now() + timeout,
			};
			this.msgQueue.set(id, m);
			this.sendMsgBySessionId(r);
		});
	}

	//强制下线
	kickSessionId(sessionId: SessionId, reason: string) {
		this.notifyMessage({
			url: RpcUrlData.forceDisconnect,
			data: { reason },
			sessionId: sessionId,
		});
		queueMicrotask(() => {
			//向客户端通知强制掉线
			this.socketManager.disconnect(sessionId, reason, true);
		});
	}

	//失败的消息处理
	handleFailMsg(msg: RpcMessage, res: RpcResponseType) {
		this.rpcLogger.error(res.msg);
		this.rpcLogger.error(msg);

		if (msg.id) {
			let msgItem = this.msgQueue.get(msg.id);
			if (msgItem) {
				msgItem.cb.done(res, null);
				this.msgQueue.delete(msg.id);
			}
		}
	}

	@ScheduledInterval({
		initialDelay: 1000, //初始化后第一次延迟多久后执行
		fixedRate: 100, //大致100ms执行一次
	})
	async checkMsgQueue(diff: number, stop: boolean) {
		if (this.checkStatus) {
			this.rpcLogger.warn("Client message detection time is too long");
			return;
		}

		try {
			let nowTime = Date.now();
			this.checkStatus = true;
			if (this.failMsgQueue.length > 0) {
				let newFailMsgQueue: RpcFailMsgQueue[] = [];

				for (let item of this.failMsgQueue) {
					item.retryInterval -= diff;
					if (item.retryInterval <= 0) {
						//进行发送
						let flag = await this.retrySendMsg(item);
						if (flag == SocketMsgStatus.success) {
							continue;
						}

						if (flag == SocketMsgStatus.offline) {
							this.handleFailMsg(item.msg, {
								code: RpcResponseCode.disconnect,
								msg: `session offline`,
							});
							continue;
						}

						item.retryInterval = item.maxRetryInterval;
						item.retryCount++;
						if (item.retryCount >= item.maxRetryCount) {
							this.handleFailMsg(item.msg, {
								code: RpcResponseCode.retryTimes,
								msg: `The message retries more than ${item.retryCount} times`,
							});
							continue;
						}
					}

					if (nowTime > item.expiretime) {
						this.handleFailMsg(item.msg, {
							code: RpcResponseCode.timeout,
							msg: `The message times out ${item.timeout} ms`,
						});
						continue;
					}

					newFailMsgQueue.push(item);
				}
				this.failMsgQueue = newFailMsgQueue;
			}

			//检测发生过去消息但是依然没收到返回的情况
			let cleanIds: number[] = [];
			this.msgQueue.forEach((item, id) => {
				if (nowTime > item.expiretime) {
					cleanIds.push(id);
				}
			});

			cleanIds.forEach((id) => {
				let item = this.msgQueue.get(id);
				if (item) {
					this.handleFailMsg(
						{
							id,
							url: "",
							mode: InteractiveMode.request,
						},
						{
							code: RpcResponseCode.timeout,
							msg: `The message times out ${item.timeout} ms`,
						}
					);
				}

				this.msgQueue.delete(id);
			});
		} catch (e) {
			this.rpcLogger.error("rpc server checkMsgQueue error");
			this.rpcLogger.error(e);
		} finally {
			this.checkStatus = false;
		}
	}

	use(m: Middleware) {
		this.middleware.push(m);
		this.setMiddleware();
	}

	private getResponseMiddleware(): Middleware {
		let onerror: RPCErrorService = this.app.getComponentByName(RpcMetaData.RPCErrorService);
		if (!!onerror) {
			return onerror.response();
		}

		return this.response();
	}

	private setMiddleware() {
		let newList = [this.getResponseMiddleware()];
		let middlerList: Middleware[] = this.app.getSetting(RpcMetaData.RPCMIDDLEWARE) || [];
		newList = [...newList, ...middlerList, ...this.middleware];

		const routerMiddleware = this.loadRoute();
		if (routerMiddleware) {
			newList.push(routerMiddleware);
		}

		this.composeMiddleware = ComposeService(newList);
	}

	async start() {
		//加载中间件
		this.setMiddleware();

		//这个步骤放在最后做
		let rpcConfig: RpcConfig = this.app.getSetting(RpcMetaData.RpcConfig);
		if (!rpcConfig) {
			this.rpcLogger.warn(`This ${RpcMetaData.RpcConfig} was not found`);
			return;
		}

		let serverList = rpcConfig.list;
		if (serverList.length == 0) {
			this.rpcLogger.warn(`RPC Server list is empty`);
			return;
		}
		this.socketManager.bind(this);
		this.socketManager.start(serverList);

		this.rpcConfig.list = serverList;

		if (rpcConfig.retry) {
			Object.assign(this.rpcConfig.retry, rpcConfig.retry);
		}
		//开启定时检测
		this.checkMsgQueue(0, false);
	}

	async stop() {
		this.checkMsgQueue(0, true);
		this.failMsgQueue = [];
		this.msgQueue.clear();
		await this.socketManager.stop();
	}
}
