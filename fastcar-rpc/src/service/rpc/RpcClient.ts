import { Logger } from "@fastcar/core";
import { InteractiveMode, RetryConfig, RpcClientConfig, RpcClientMsgBox, RpcMessage, RpcResponseCode, RpcResponseType } from "../../types/RpcConfig";
import { SocketClientConfig } from "../../types/SocketConfig";
import { SocketClient } from "../socket/SocketClient";
import { SocketClientFactory } from "../socket/SocketFactory";
import { EnableScheduling, ScheduledInterval } from "@fastcar/timer";
import TaskAsync from "../../model/TaskAsync";
import { ValidationUtil } from "@fastcar/core/utils";
import RpcAsyncService from "../RpcAsyncService";
import MsgClientHookService from "../MsgClientHookService";
import { RpcUrlData } from "../../constant/RpcUrlData";
import { Log } from "@fastcar/core/annotation";
import { PBConfig, ProtoList } from "../../types/PBConfig";
import ProtoBuffService from "../ProtoBuffService";

//封装一个可用的rpc框架
@EnableScheduling
export default class RpcClient implements MsgClientHookService {
	protected client: SocketClient;
	protected msgQueue: Map<number, RpcClientMsgBox>; //序列号 消息队列
	protected serialId: number; //序列号
	protected config: RpcClientConfig; //消息配置
	protected checkStatus: boolean;
	protected rpcAsyncService: RpcAsyncService;
	protected checkConnectTimer: number;
	@Log("rpc-client")
	protected rpcLogger!: Logger;

	constructor(config: SocketClientConfig, rpcAsyncService: RpcAsyncService, retry?: RetryConfig) {
		let ClientClass = SocketClientFactory(config.type);
		if (!ClientClass) {
			this.rpcLogger.error(`Failed to create this client type by ${config.type}`);
			throw new Error(`Failed to create this client type by ${config.type}`);
		}
		this.config = Object.assign(
			{
				retryCount: 3, //错误重试次数 默认三次
				retryInterval: 1000, //重试间隔 默认一秒
				maxMsgNum: 10000, //最大消息瞬时并发数
				timeout: 3000,
				disconnectInterval: 100,
			},
			config,
			retry
		);
		this.client = new ClientClass(this.config, this);
		this.msgQueue = new Map();
		this.serialId = 0;
		this.checkStatus = false;
		this.rpcAsyncService = rpcAsyncService;
		this.checkConnectTimer = this.config.disconnectInterval || 1000;
	}

	//初始化配置事件
	addProtoBuf(p: ProtoList): void {
		//先加载root节点
		let root = ProtoBuffService.addProtoRoot(p.root.protoPath);

		if (p.prefixUrl && !p.prefixUrl.startsWith("/")) {
			p.prefixUrl = `/${p.prefixUrl}`;
		}

		let service = root.lookupService(p.root.service);

		let methods: string[] = Object.keys(service.methods);
		let pMap: Map<string, string> = new Map();

		if (p?.list && p.list.length > 0) {
			p.list.forEach((item) => {
				pMap.set(item.method, item.url);
			});
		}

		methods.forEach((m) => {
			let pp: PBConfig = {
				protoPath: p.root.protoPath,
				service: p.root.service,
				url: pMap.has(m) ? (pMap.get(m) as string) : `/${m}`,
				method: m,
			};
			if (!pp.url.startsWith("/")) {
				pp.url = "/" + pp.url;
			}
			if (p.prefixUrl) {
				if (!pp.url.startsWith(p.prefixUrl)) {
					pp.url = p.prefixUrl + pp.url;
				}
			}
			ProtoBuffService.addUrlMapping(pp);
		});
	}

	addSerialId(): number {
		if (this.msgQueue.size >= this.config.maxMsgNum) {
			return -1;
		}

		for (let i = 1; i < this.config.maxMsgNum; i++) {
			if (this.serialId >= this.config.maxMsgNum) {
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

	async start() {
		return new Promise((resolve) => {
			this.client.connect();
			setTimeout(() => {
				resolve(this.client.connected);
			}, 50);
		});
	}

	stop(reason: string) {
		this.client.offline(reason);
	}

	close() {
		this.checkMsg(0, true);
		this.client.close();
	}

	getClient(): SocketClient {
		return this.client;
	}

	//是否已经连接
	isConnect() {
		return this.client.connected;
	}

	isForceConnect() {
		return this.client.forceConnect;
	}

	getSessionId() {
		return this.client.sessionId;
	}

	async handleMsg(msg: RpcMessage): Promise<void> {
		if (InteractiveMode.response == msg.mode) {
			let id = msg.id;
			if (ValidationUtil.isNumber(id)) {
				let item = this.msgQueue.get(id as number);
				if (item) {
					item.cb.done(null, msg);
				}
				this.msgQueue.delete(id as number);
			}
		} else {
			if (InteractiveMode.notify == msg.mode) {
				if (msg.url == RpcUrlData.forceDisconnect) {
					this.client.forceConnect = true;
					let data: any = msg.data;
					let reason: string = data?.reason;
					this.client.offline(reason);
				} else {
					this.rpcAsyncService.handleMsg(msg.url, msg.data || {});
				}
			} else {
				//向server端发送消息
				let repData = await this.rpcAsyncService.handleMsg(msg.url, msg.data || {});
				this.client.sendMsg({
					id: msg.id,
					data: repData || {},
					url: msg.url,
					mode: InteractiveMode.response,
				});
			}
		}
	}

	//发送消息
	async request(url: string, data?: Object, opts?: RetryConfig): Promise<RpcResponseType> {
		let id = this.addSerialId();

		let m: {
			url: string;
			data?: Object;
			retryCount: number;
			retryInterval: number;
			timeout: number; //超时时间
		} = Object.assign(
			{
				url,
				data: data,
			},
			{
				retryCount: opts?.retryCount || this.config.retryCount,
				retryInterval: opts?.retryInterval || this.config.retryInterval,
				timeout: opts?.timeout || this.config.timeout, //超时时间
			}
		);

		return new Promise((resolve) => {
			// if (!this.client.connected) {
			// 	resolve({ code: RpcResponseCode.disconnect, msg: "socket is disconnect" });
			// 	return;
			// }

			if (id == -1) {
				//消息太多没有处理完
				resolve({ code: RpcResponseCode.busy, msg: "The message number has been used up" });
				return;
			}

			let timeout = m.timeout || this.config.timeout;
			let msg: RpcMessage = {
				id,
				url: m.url,
				mode: InteractiveMode.request,
			};

			if (ValidationUtil.isNotNull(m.data)) {
				msg.data = m.data;
			}

			let cb = new TaskAsync((err: RpcResponseType | null, res: RpcMessage) => {
				err ? resolve(err) : resolve({ code: RpcResponseCode.ok, data: res.data } || { code: RpcResponseCode.ok });
			});

			let rpcMsg: RpcClientMsgBox = {
				id,
				msg,
				retryCount: 0,
				retryInterval: Date.now() + m.retryInterval,
				expiretime: Date.now() + timeout,
				timeout,
				maxRetryCount: m.retryCount,
				maxRetryInterval: m.retryInterval,
				cb,
			};

			this.msgQueue.set(id, rpcMsg);
			this.client.sendMsg(msg);
		});
	}

	@ScheduledInterval({
		initialDelay: 1000, //初始化后第一次延迟多久后执行
		fixedRate: 100, //大致100ms去check一次
	})
	async checkMsg(diff: number, stop: boolean) {
		if (this.checkStatus) {
			this.rpcLogger.warn("Client message detection time is too long");
			return;
		}

		try {
			this.checkStatus = true;
			let nowTime = Date.now();

			if (this.msgQueue.size > 0) {
				//进行断线重连
				if (!this.isConnect()) {
					this.checkConnectTimer -= diff;
					if (this.checkConnectTimer <= 0) {
						this.checkConnectTimer = this.config.disconnectInterval || 1000;
						await this.start();
					}
				}

				let cleanIds: Map<number, RpcResponseType> = new Map();
				this.msgQueue.forEach((item, id) => {
					if (nowTime > item.expiretime) {
						cleanIds.set(id, {
							code: RpcResponseCode.timeout,
							msg: `The message times out ${item.timeout} ms`,
						});
						return;
					}

					//如果是断线的则进行堆积
					if (!this.isConnect()) {
						return;
					}

					if (item.retryInterval <= nowTime) {
						//发送消息
						if (item.retryCount >= item.maxRetryCount) {
							cleanIds.set(id, {
								code: RpcResponseCode.retryTimes,
								msg: `The message retries more than ${item.retryCount} times`,
							});
						} else {
							//重发消息
							item.retryCount++;
							this.client.sendMsg(item.msg);
						}
						item.retryInterval = nowTime + item.maxRetryInterval;
					}
				});

				cleanIds.forEach((resp, id) => {
					let item = this.msgQueue.get(id);
					if (item) {
						this.rpcLogger.error(resp);
						this.rpcLogger.error(`${JSON.stringify(item.msg)}`);
						item.cb.done(resp, null);
					}
					this.msgQueue.delete(id);
				});
			}
		} catch (e) {
			this.rpcLogger.error("rpc client checkMsgQueue error");
			this.rpcLogger.error(e);
		} finally {
			this.checkStatus = false;
		}
	}
}
