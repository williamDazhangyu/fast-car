import SocketServer from "./SocketServer";
import { ClientSession, ServerId, SessionId, SocketServerConfig } from "../../type/SocketConfig";
import { ValidationUtil } from "fastcar-core/utils";
import { SocketServerFactory } from "./SocketFactory";
import MsgHookService from "../MsgHookService";
import { SocketEnum } from "../../constant/SocketEnum";
import MsgCallbackService from "../MsgCallbackService";

export default class SocketManager implements MsgHookService {
	protected serverMap: Map<ServerId, SocketServer>; //key值用来表示是哪个通讯协议 干嘛的 sid
	protected clientSessionMap: Map<SessionId, ClientSession>; //客户端的会话值 sessionId
	protected msgCallBack: MsgCallbackService;

	constructor(msgCallBack: MsgCallbackService) {
		this.serverMap = new Map();
		this.clientSessionMap = new Map();
		this.msgCallBack = msgCallBack;
	}

	connect(sessionId: string, serverId: string): void {
		let session: ClientSession = {
			sessionId,
			serverId,
			connectedTime: Date.now(),
			settings: new Map(),
		};
		this.clientSessionMap.set(serverId, session);
		this.msgCallBack.connect(session);
	}

	disconnect(sessionId: string, reason: string, force: boolean): void {
		let session = this.clientSessionMap.get(sessionId);
		if (session) {
			let serverId = session.serverId;
			if (force) {
				//通知server管理层下线
				let socketServer = this.serverMap.get(serverId);
				if (socketServer) {
					socketServer.removeConnect({ sessionId, reason });
				}
			}

			this.clientSessionMap.delete(sessionId);
			this.msgCallBack.disconnect(session, reason);
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

	//发送消息
	async sendMsg(sessionId: string, msg: Object): Promise<boolean> {
		let server = this.getSocketServerBySessionId(sessionId);
		return server ? await server.sendMsg(sessionId, msg) : false;
	}

	//加入频道
	joinChannel(sessionId: string, channel: string): boolean {
		let server = this.getSocketServerBySessionId(sessionId);
		if (!server) {
			return false;
		}

		server.joinChannel(sessionId, channel);
		return true;
	}

	leaveChannel(sessionId: string, channel: string): void {
		let server = this.getSocketServerBySessionId(sessionId);
		if (!server) {
			return;
		}

		server.leaveChannel(sessionId, channel);
	}

	sendMsgByChannel(channel: string, msg: Object): void {
		this.serverMap.forEach(server => {
			server.sendMsgByChannel(channel, msg);
		});
	}

	private checkSocketConfig(socketConfig: SocketServerConfig[]): boolean {
		if (!Array.isArray(socketConfig)) {
			return false;
		}

		let keys2 = Reflect.ownKeys(SocketEnum);
		let flag = socketConfig.every(item => {
			if (!keys2.includes(item.type)) {
				return false;
			}

			return ValidationUtil.isString(item.id) && ValidationUtil.isNumber(item.port);
		});

		if (!flag) {
			return false;
		}

		return true;
	}

	async start(socketConfig: SocketServerConfig[]): Promise<void> {
		//读取配置进行socket初始化
		if (!this.checkSocketConfig(socketConfig)) {
			throw new Error("socket config is error");
		}

		socketConfig.forEach(async item => {
			let SocketClass = SocketServerFactory(item.type);
			if (SocketClass) {
				let server: SocketServer = new SocketClass(item, this);
				await server.listen();
				console.info(`socket server [${item.id}] is running in ${item.port}`);
			} else {
				console.error(`This type [${item.type}] of connection is not supported`);
			}
		});
	}

	async stop(): Promise<void> {
		for (let [serverId, server] of this.serverMap) {
			await server.close();
			console.info(`${serverId} is close`);
		}

		this.clientSessionMap.clear();
		this.serverMap.clear();
	}
}
