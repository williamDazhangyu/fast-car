import { FastCarApplication, Logger } from "@fastcar/core";
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
import { Autowired, DemandInjection, Log } from "@fastcar/core/annotation";
import { PBConfig, ProtoList } from "../../types/PBConfig";

//封装一个可用的rpc框架
@DemandInjection
@EnableScheduling
export default class RpcClient implements MsgClientHookService {
	protected clients: SocketClient[];
	protected msgQueue: Map<number, RpcClientMsgBox>; //序列号 消息队列
	protected serialId: number; //序列号
	protected config: RpcClientConfig; //消息配置
	protected checkStatus: boolean;
	protected rpcAsyncService: RpcAsyncService;
	protected checkConnectTimer: number;
	@Log("rpc-client")
	protected rpcLogger: Logger = console;

	@Autowired
	private app!: FastCarApplication;

	private pollIndex: number;

	private maxPendingSize: number; //最大延迟并发量

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
				disconnectInterval: 10000, //断线重连十秒
				increase: ValidationUtil.isBoolean(retry?.increase) ? !!retry?.increase : true,
			},
			config,
			retry
		);

		this.config.timeout = this.getTimeOut({
			interval: this.config.retryInterval,
			count: this.config.retryCount,
			timeout: this.config.timeout,
			increase: retry?.increase,
		});

		this.clients = [];
		this.msgQueue = new Map();
		this.serialId = 0;
		this.checkStatus = false;
		this.rpcAsyncService = rpcAsyncService;
		this.checkConnectTimer = this.config.disconnectInterval || 1000;
		this.maxPendingSize = Math.floor(this.config.maxMsgNum / 2);

		let connectionLimit = config.connectionLimit || 1;

		for (let i = 0; i < connectionLimit; i++) {
			this.clients.push(new ClientClass(this.config, this));
		}

		this.pollIndex = -1;
	}

	//初始化配置事件
	addProtoBuf(p: ProtoList): void {
		let ProtoBuffService = this.app.getComponentByName("ProtoBuffService") as any;

		//先加载root节点
		let root = ProtoBuffService?.addProtoRoot(p.root.protoPath);

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
			ProtoBuffService?.addUrlMapping(pp);
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
		for (let c of this.clients) {
			if (!c.connected) {
				await c.connect();
			}
		}
	}

	stop(reason: string) {
		this.clients.forEach((c) => {
			c.offline(reason);
		});
	}

	close() {
		this.checkMsg(0, true);
		this.clients.forEach((c) => {
			c.close();
		});
	}

	getClient(): {
		index: number;
		client: SocketClient;
	} {
		let index = ++this.pollIndex;
		if (index >= this.clients.length) {
			index = 0;
			this.pollIndex = 0;
		}

		return {
			index: this.pollIndex,
			client: this.clients[this.pollIndex],
		};
	}

	getConnectedClient() {
		for (let c of this.clients) {
			if (c.connected) {
				return c;
			}
		}

		return null;
	}

	//是否已经连接
	isConnect() {
		return this.clients.some((c) => {
			return c.connected;
		});
	}

	isForceConnect() {
		return this.clients[0].forceConnect;
	}

	private getTimeOut({ interval, count, timeout, increase = false }: { interval: number; count: number; timeout: number; increase?: boolean }) {
		let sum = increase ? Math.ceil((interval * count * (1 + count)) / 2) : count * interval;

		return Math.max(sum, timeout);
	}

	async handleMsg(msg: RpcMessage): Promise<void> {
		if (InteractiveMode.response == msg.mode) {
			let id = msg.id;
			if (ValidationUtil.isNumber(id)) {
				let item = this.msgQueue.get(id as number);
				if (item) {
					if (msg.data && msg.data?.code == RpcResponseCode.busy) {
						item.retryCount += 1;
						return; //如果服务器显示繁忙则放入等待队列处理
					}

					item.cb.done(null, msg);
				}
				this.msgQueue.delete(id as number);
			}
		} else {
			if (InteractiveMode.notify == msg.mode) {
				if (msg.url == RpcUrlData.forceDisconnect) {
					let data: any = msg.data;
					let reason: string = data?.reason;

					//集体下线
					for (let c of this.clients) {
						c.forceConnect = true;
						c.offline(reason);
					}
				} else {
					this.rpcAsyncService.handleMsg(msg.url, msg.data || {});
				}
			} else {
				//向server端发送消息
				let repData = await this.rpcAsyncService.handleMsg(msg.url, msg.data || {});
				this.getConnectedClient()?.sendMsg({
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

		m.timeout = this.getTimeOut({
			interval: m.retryInterval,
			count: m.retryCount,
			increase: opts?.increase,
			timeout: m.timeout,
		});

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

			let timeout = m.timeout;
			let msg: RpcMessage = {
				id,
				url: m.url,
				mode: InteractiveMode.request,
			};

			if (ValidationUtil.isNotNull(m.data)) {
				msg.data = m.data;
			}

			let cb = new TaskAsync((err: RpcResponseType | null, res: RpcMessage) => {
				err ? resolve(err) : resolve({ code: RpcResponseCode.ok, data: res.data || {} });
			});

			//这边的逻辑要改下 timeout至少是间隔时间乘以间隔次数
			let cres = this.getClient();
			let rpcMsg: RpcClientMsgBox = {
				id,
				msg,
				retryCount: 0,
				retryInterval: m.retryInterval,
				expiretime: timeout,
				timeout,
				maxRetryCount: m.retryCount,
				maxRetryInterval: m.retryInterval,
				cb,
				clientIndex: cres.index,
				increase: opts?.increase || this.config.increase,
			};

			// this.rpcLogger.debug(`发送消息的序号----${client.index}`);
			this.msgQueue.set(id, rpcMsg);

			if (!cres.client.connected) {
				//重置检测时间
				this.checkConnectTimer = 0;
				rpcMsg.retryInterval = 0; //重发消息的间隔为0
			} else {
				cres.client.sendMsg(msg);
			}
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

			//进行断线重连
			this.checkConnectTimer -= diff;
			if (this.checkConnectTimer <= 0) {
				this.checkConnectTimer = this.config.disconnectInterval || 1000;
				await this.start();
			}

			if (this.msgQueue.size > 0) {
				let pending = this.maxPendingSize;
				let cleanIds: Map<number, RpcResponseType> = new Map();

				let msgQueueList = this.msgQueue.values();
				for (let item of msgQueueList) {
					let id = item.id;
					let client = this.clients[item.clientIndex];
					if (!client.connected) {
						continue;
					}

					item.retryInterval -= diff;
					item.expiretime -= diff;

					if (item.retryInterval <= 0) {
						//发送消息
						if (item.retryCount >= item.maxRetryCount) {
							cleanIds.set(id, {
								code: RpcResponseCode.retryTimes,
								msg: `The message retries more than ${item.retryCount} times`,
							});
						} else {
							//重发消息
							item.retryCount++;
							client.sendMsg(item.msg);
							item.retryInterval = item.increase ? item.maxRetryInterval * (item.retryCount + 1) : item.maxRetryInterval;
							pending--;
						}
					} else if (item.expiretime <= 0) {
						cleanIds.set(id, {
							code: RpcResponseCode.timeout,
							msg: `The message times out ${item.timeout} ms`,
						});
					}

					if (pending <= 0) {
						break;
					}
				}

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
