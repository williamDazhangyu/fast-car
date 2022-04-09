import { Logger } from "fastcar-core";
import { InteractiveMode, RetryConfig, RpcClientConfig, RpcClientMsgBox, RpcClientRequestType, RpcMessage, RpcResponseCode, RpcResponseType } from "../../types/RpcConfig";
import { SocketClientConfig } from "../../types/SocketConfig";
import MsgHookService from "../MsgHookService";
import { SocketClient } from "../socket/SocketClient";
import { SocketClientFactory } from "../socket/SocketFactory";
import { EnableScheduling, ScheduledInterval } from "fastcar-timer";
import TaskAsync from "../../model/TaskAsync";
import { ValidationUtil } from "fastcar-core/utils";
import RpcAsyncService from "../RpcAsyncService";
import MsgClientHookService from "../MsgClientHookService";
import { RpcUrlData } from "../../constant/RpcUrlData";

//封装一个可用的rpc框架
@EnableScheduling
export default class RpcClient implements MsgClientHookService {
	private rpcLogger!: Logger;
	protected client: SocketClient;
	protected msgQueue: Map<number, RpcClientMsgBox>; //序列号 消息队列
	protected serialId: number; //序列号
	protected config: RpcClientConfig; //消息配置
	protected checkStatus: boolean;
	protected rpcAsyncService: RpcAsyncService;
	protected checkConnectTimer: number;

	constructor(config: SocketClientConfig, rpcLogger: Logger, rpcAsyncService: RpcAsyncService, retry?: RetryConfig) {
		let ClientClass = SocketClientFactory(config.type);
		if (!ClientClass) {
			this.rpcLogger.error(`Failed to create this client type by ${config.type}`);
			throw new Error(`Failed to create this client type by ${config.type}`);
		}
		this.rpcLogger = rpcLogger;
		this.config = Object.assign(
			{
				retryCount: 3, //错误重试次数 默认三次
				retryInterval: 100, //重试间隔 默认一秒
				maxMsgNum: 10000, //最大消息并发数
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
		this.checkConnectTimer = 0;
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
			if (!!id) {
				let item = this.msgQueue.get(id);
				if (item) {
					item.cb.done(null, msg);
				}
				this.msgQueue.delete(id);
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
				let repData = await this.rpcAsyncService.handleMsg(msg.url, msg.data || {});
				this.client.sendMsg({
					id: msg.id,
					data: repData,
					url: msg.url,
					mode: InteractiveMode.response,
				});
			}
		}
	}

	//发送消息
	async request(url: string, data?: Object, opts?: RetryConfig): Promise<RpcResponseType> {
		let id = this.addSerialId();

		let m: RpcClientRequestType = {
			url,
			data,
		};
		Object.assign(m, opts);

		return new Promise((resolve, reject) => {
			if (!this.client.connected) {
				reject(new Error(`socket is disconnect`));
				return;
			}

			if (id == -1) {
				//消息太多没有处理完
				reject(new Error(`msg too busy`));
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
				retryInterval: m.retryInterval || this.config.retryInterval,
				expiretime: Date.now() + timeout,
				timeout,
				maxRetryCount: m.retryCount || this.config.retryCount,
				maxRetryInterval: m.retryInterval || this.config.retryInterval,
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

					item.retryInterval -= diff;
					if (item.retryInterval <= 0) {
						//发送消息
						if (item.retryCount >= this.config.retryCount) {
							cleanIds.set(id, {
								code: RpcResponseCode.retryTimes,
								msg: `The message retries more than ${item.retryCount} times`,
							});
						} else {
							//重发消息
							item.retryCount++;
							this.client.sendMsg(item.msg);
						}
						item.retryInterval = this.config.retryInterval;
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

	getLogger() {
		return this.rpcLogger;
	}
}
