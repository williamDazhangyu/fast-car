import { DataMap, Logger } from "@fastcar/core";
import { ValidationUtil } from "@fastcar/core/utils";
import { CallDependency, DemandInjection, Log } from "@fastcar/core/annotation";
import { ServerConfig, ServerType, ServerApplication, Protocol } from "@fastcar/server";
import SocketServer from "./SocketServer";
import { ClientSession, CustomId, ServerId, SessionId, SocketServerConfig, SocketSession } from "../../types/SocketConfig";
import { SocketServerFactory } from "./SocketFactory";
import MsgHookService from "../MsgHookService";
import { SocketEnum } from "../../constant/SocketEnum";
import MsgCallbackService from "../MsgCallbackService";
import { nanoid } from "nanoid";
import { SocketMsgStatus } from "../../constant/SocketMsgStatus";
import { InteractiveMode, RpcMessage } from "../../types/RpcConfig";
/***
 * @version 1.0 用于集成各个不同类型的socket和实现丰富的消息逻辑表达
 */
@DemandInjection
export default class SocketManager implements MsgHookService {
	protected serverMap: Map<ServerId, SocketServer>; //key值用来表示是哪个通讯协议 干嘛的 sid

	protected clientSessionMap: Map<SessionId, ClientSession>; //客户端的会话值 sessionId

	protected msgCallBack!: MsgCallbackService;

	protected customIds: DataMap<
		CustomId,
		{
			sessionIds: Array<SessionId>;
			channel?: Set<string>;
		}
	>; //自定义id和sessionId绑定

	@Log("socket")
	protected logger!: Logger;

	protected channels: Map<string, Set<SessionId>>;

	protected customChannel: Map<string, Set<CustomId>>; //自定义渠道

	@CallDependency
	private netServer!: ServerApplication;

	constructor() {
		this.serverMap = new Map();
		this.clientSessionMap = new Map();
		this.channels = new Map();
		this.customIds = new DataMap();
		this.customChannel = new Map();
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

			this.deleteSession(sessionId);
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
	async sendMsg(sessionId: string, msg: RpcMessage = { mode: InteractiveMode.notify, url: "" }): Promise<SocketMsgStatus> {
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

	//发送自定义id的消息
	async sendMsgByCustomId(customId: CustomId, msg: RpcMessage = { mode: InteractiveMode.notify, url: "" }): Promise<SocketMsgStatus> {
		let s = this.customIds.get(customId);
		if (s && s.sessionIds.length > 0) {
			let sessionid = s.sessionIds[0];

			if (s.sessionIds.length > 1) {
				let index = Math.floor(Math.random() * s.sessionIds.length);
				sessionid = s.sessionIds[index];
			}

			return await this.sendMsg(sessionid, msg);
		}

		return SocketMsgStatus.fail;
	}

	//绑定自定义id
	bindCustomID(cid: CustomId, sid: SessionId) {
		let citem = this.customIds.get(cid);
		if (!citem) {
			citem = {
				sessionIds: [],
			};
			this.customIds.set(cid, citem);
		}

		let item = this.clientSessionMap.get(sid);
		if (item) {
			if (!citem.sessionIds.includes(sid)) {
				citem.sessionIds.unshift(sid); //永远保持最新的
			}
			item.cid = cid;
		}
	}

	//移除自定义id
	unbindCustomID(cid: CustomId, sid: SessionId) {
		let citem = this.customIds.get(cid);
		if (citem) {
			let index = citem.sessionIds.indexOf(sid);
			if (index > -1) {
				citem.sessionIds.splice(index, 1);
				this.deleteSession(sid);
			}
		}
	}

	//删除自定义id
	removeCustomID(cid: CustomId) {
		let citem = this.customIds.get(cid);
		if (citem) {
			citem.sessionIds.forEach((sid) => {
				this.unbindCustomID(cid, sid);
			});

			citem.channel?.forEach((c) => {
				this.leaveChannelByCustomId(cid, c);
			});

			this.customIds.delete(cid);
		}
	}

	//加入频道
	joinChannel(sessionId: string, channel: string): boolean {
		let session = this.getClientSession(sessionId);
		if (!session) {
			return false;
		}

		if (!this.channels.has(channel)) {
			this.channels.set(channel, new Set<string>());
		}

		let sessionIds = this.channels.get(channel);
		if (!sessionIds?.has(sessionId)) {
			sessionIds?.add(sessionId);
		}

		if (!session.channels) {
			session.channels = new Set();
		}

		session.channels.add(channel);

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

		sessionIds.delete(sessionId);
		if (sessionIds.size == 0) {
			this.channels.delete(channel);
		}

		session.channels?.delete(channel);
	}

	//根据sessionId获取所有的渠道
	getChannelBySessionId(sessionId: SessionId): string[] {
		let session = this.getClientSession(sessionId);
		if (session && session?.channels) {
			return [...session.channels.keys()];
		}

		return [];
	}

	sendMsgByChannel(channel: string, msg: RpcMessage, excludeIds: SessionId[] = []): void {
		let sessionIds = this.channels.get(channel);
		if (!sessionIds || sessionIds.size == 0) {
			return;
		}

		sessionIds.forEach((sessionId) => {
			if (excludeIds.includes(sessionId)) {
				return;
			}

			this.sendMsg(sessionId, msg);
		});
	}

	joinChannelByCustomId(cid: CustomId, channel: string): boolean {
		let csession = this.customIds.get(cid);
		if (!csession) {
			return false;
		}

		let ids = this.customChannel.get(channel);
		if (!ids) {
			ids = new Set<string>();
			this.customChannel.set(channel, ids);
		}

		ids.add(channel);
		if (!csession.channel) {
			csession.channel = new Set();
		}
		csession.channel.add(channel);
		return true;
	}

	leaveChannelByCustomId(cid: CustomId, channel: string): void {
		let ids = this.customChannel.get(channel);
		if (!ids || !ids.has(cid)) {
			return;
		}

		ids.delete(cid);
		if (ids.size == 0) {
			this.customChannel.delete(channel);
		}
	}

	//根据sessionId获取所有的渠道
	getChannelByCustomId(cid: CustomId): string[] {
		let sets = this.customIds.get(cid)?.channel;
		return sets ? [...sets.values()] : [];
	}

	sendMsgToCustomIdByChannel(channel: string, msg: RpcMessage, excludeIds: CustomId[] = []): void {
		let customIds = this.customChannel.get(channel);
		if (!customIds || customIds.size == 0) {
			return;
		}

		customIds.forEach((customId) => {
			if (excludeIds.includes(customId)) {
				return;
			}

			this.sendMsgByCustomId(customId, msg);
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
		let item = this.clientSessionMap.get(sessionId);
		if (item) {
			//离开频道
			item.channels?.forEach((channel) => {
				this.leaveChannel(sessionId, channel);
			});

			item.channels?.clear();
			this.clientSessionMap.delete(sessionId);

			let cid = item.cid;
			if (cid) {
				this.unbindCustomID(cid, sessionId);
			}
		}
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


