import { Logger } from "fastcar-core";
import { ValidationUtil } from "fastcar-core/utils";
import { CallDependency, Log } from "fastcar-core/annotation";
import { ServerConfig, ServerType, ServerApplication, Protocol } from "fastcar-server";
import SocketServer from "./SocketServer";
import { ClientSession, ServerId, SessionId, SocketServerConfig, SocketSession } from "../../types/SocketConfig";
import { SocketServerFactory } from "./SocketFactory";
import MsgHookService from "../MsgHookService";
import { SocketEnum } from "../../constant/SocketEnum";
import MsgCallbackService from "../MsgCallbackService";
import { nanoid } from "nanoid";
import { SocketMsgStatus } from "../../constant/SocketMsgStatus";
/***
 * @version 1.0 用于集成各个不同类型的socket和实现丰富的消息逻辑表达
 */
export default class SocketManager implements MsgHookService {
	protected serverMap: Map<ServerId, SocketServer>; //key值用来表示是哪个通讯协议 干嘛的 sid
	protected clientSessionMap: Map<SessionId, ClientSession>; //客户端的会话值 sessionId
	protected msgCallBack!: MsgCallbackService;

	@Log("socket")
	protected logger!: Logger;

	protected channels: Map<string, SessionId[]>;

	@CallDependency
	private netServer!: ServerApplication;

	constructor() {
		this.serverMap = new Map();
		this.clientSessionMap = new Map();
		this.channels = new Map();
	}

	async auth(username: string, password: string, session: ClientSession): Promise<boolean> {
		if (!this.msgCallBack) {
			return false;
		}

		return await this.msgCallBack.auth(username, password, session);
	}

	bind(msgCallBack: MsgCallbackService) {
		this.msgCallBack = msgCallBack;
	}

	getLogger(): Logger {
		return this.logger;
	}

	connect(sessionId: string): void {
		let session: ClientSession | null = this.getClientSession(sessionId);
		if (session) {
			this.msgCallBack.connect(session);
		}
	}

	disconnect(sessionId: string, reason: string, force: boolean): void {
		let session = this.clientSessionMap.get(sessionId);
		if (session) {
			let serverId = session.serverId;
			if (force) {
				//通知server管理层下线
				let socketServer = this.serverMap.get(serverId);
				if (socketServer) {
					socketServer.kickConnect({ sessionId, reason });
				}
			} else {
				this.msgCallBack.disconnect(session, reason);
			}

			this.clientSessionMap.delete(sessionId);
		}
	}

	handleMsg(sessionId: string, msg: Object): void {
		let session = this.clientSessionMap.get(sessionId);
		if (session) {
			this.msgCallBack.handleMsg(session, msg);
		}
	}

	getClientSession(sessionId: string) {
		return this.clientSessionMap.get(sessionId) || null;
	}

	getSocketServer(serverId: string) {
		return this.serverMap.get(serverId) || null;
	}

	getSocketServerBySessionId(sessionId: string) {
		let session = this.clientSessionMap.get(sessionId);
		if (!session) {
			return null;
		}

		let server = this.serverMap.get(session.serverId);
		return server || null;
	}

	getSocketClientBySessionId(sessionId: string): SocketSession | null {
		let server = this.getSocketServerBySessionId(sessionId);
		if (server) {
			return server.getSession(sessionId) || null;
		}

		return null;
	}

	//会话是否在线
	sessionOnline(sessionId: string) {
		let session = this.clientSessionMap.get(sessionId);
		if (!session) {
			return false;
		}

		return this.serverMap.has(session.serverId);
	}

	//发送消息
	async sendMsg(sessionId: string, msg: Object = {}): Promise<SocketMsgStatus> {
		let server = this.getSocketServerBySessionId(sessionId);
		if (server) {
			let flag = await server.sendMsgBySessionId(sessionId, msg);
			if (flag) {
				return SocketMsgStatus.success;
			}

			return SocketMsgStatus.fail;
		}

		return SocketMsgStatus.offline;
	}

	//加入频道
	joinChannel(sessionId: string, channel: string): boolean {
		let session = this.getClientSession(sessionId);
		if (!session) {
			return false;
		}

		if (!this.channels.has(channel)) {
			this.channels.set(channel, []);
		}

		let sessionIds = this.channels.get(channel);
		if (!sessionIds?.includes(sessionId)) {
			sessionIds?.push(sessionId);
		}

		return true;
	}

	leaveChannel(sessionId: string, channel: string): void {
		let session = this.getClientSession(sessionId);
		if (!session) {
			return;
		}

		let sessionIds = this.channels.get(channel);
		if (!sessionIds) {
			return;
		}

		let index = sessionIds.indexOf(sessionId);
		if (index != -1) {
			sessionIds.splice(index, 1);
			if (sessionIds.length == 0) {
				this.channels.delete(channel);
			}
		}
	}

	//根据sessionId获取所有的渠道
	getChannelBySessionId(sessionId: SessionId): string[] {
		if (!this.clientSessionMap.has(sessionId)) {
			return [];
		}

		let list: string[] = [];
		this.channels.forEach((sessionIds, channel) => {
			if (sessionIds.includes(sessionId)) {
				list.push(channel);
			}
		});

		return list;
	}

	sendMsgByChannel(channel: string, msg: Object = {}, excludeIds: SessionId[] = []): void {
		let sessionIds = this.channels.get(channel);
		if (!sessionIds || sessionIds.length == 0) {
			return;
		}

		sessionIds.forEach((sessionId) => {
			if (excludeIds.includes(sessionId)) {
				return;
			}

			this.sendMsg(sessionId, msg);
		});
	}

	getSocketServerConfig(serverId: ServerId) {
		return this.serverMap.get(serverId)?.getConfig();
	}

	private checkSocketConfig(socketConfig: SocketServerConfig[]): boolean {
		if (!Array.isArray(socketConfig)) {
			return false;
		}

		let socketValue: string[] = [];
		Reflect.ownKeys(SocketEnum).forEach((k) => {
			socketValue.push(Reflect.get(SocketEnum, k));
		});

		let flag = socketConfig.every((item) => {
			if (!socketValue.includes(item.type)) {
				return false;
			}

			if (!ValidationUtil.isString(item.id)) {
				return false;
			}

			if (!item.server) {
				item.server = {};
			}

			if (!item.extra) {
				item.extra = {};
			}

			item.server = Object.assign({ port: 80, protocol: Protocol.http }, item.server);

			return true;
		});

		if (!flag) {
			return false;
		}

		return true;
	}

	async start(socketConfig: SocketServerConfig[]): Promise<void> {
		//读取配置进行socket初始化
		if (!this.checkSocketConfig(socketConfig)) {
			let err = new Error("socket config is error");
			this.logger.error(err);
			throw err;
		}

		socketConfig.forEach(async (item) => {
			let SocketClass = SocketServerFactory(item.type);
			if (SocketClass) {
				let server: SocketServer = new SocketClass(item, this);
				await server.listen();
				this.logger.info(`${item.type} server [${item.id}] is running in ${item.server.port}`);
				this.serverMap.set(item.id, server);
			} else {
				this.logger.error(`This type [${item.type}] of connection is not supported`);
			}
		});
	}

	async stop(): Promise<void> {
		for (let [serverId, server] of this.serverMap) {
			await server.close();
			this.logger.info(`${serverId} is close`);
		}

		this.clientSessionMap.clear();
		this.serverMap.clear();
	}

	//创建一个初始的会话
	createSession(serverId: string): ClientSession {
		let id = nanoid();
		let session: ClientSession = {
			sessionId: id,
			serverId,
			connectedTime: Date.now(),
			settings: new Map(),
		};
		this.clientSessionMap.set(id, session);
		return session;
	}

	//销毁会话
	deleteSession(sessionId: SessionId) {
		this.clientSessionMap.delete(sessionId);
	}

	//获取一个网络服务器
	createNetServer(config: ServerConfig, cb?: any): ServerType {
		let server = this.netServer.createServer(config, cb);

		if (!server) {
			let err = new Error(`create net server fail by ${JSON.stringify(config)}`);
			this.logger.error(err);
			throw err;
		}

		return server;
	}
}
