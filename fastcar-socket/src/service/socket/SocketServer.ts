import { SocketDisConnect, SocketServerConfig, SocketSession, SessionId, EncodeMsg, DecodeMsg, EncodeDefault, DecodeDefault } from "../../type/SocketConfig";
import * as uuid from "uuid";
import MsgHookService from "../MsgHookService";

export default abstract class SocketServer {
	protected id: string;
	protected sessions: Map<SessionId, SocketSession>; //会话绑定
	protected manager: MsgHookService; //管理端
	protected channels: Map<string, SessionId[]>;
	protected state: boolean;
	protected config: SocketServerConfig;
	protected encode: EncodeMsg;
	protected decode: DecodeMsg;

	constructor(config: SocketServerConfig, manager: MsgHookService) {
		this.id = config.id;
		this.sessions = new Map();
		this.manager = manager;
		this.channels = new Map();
		this.state = false;
		this.config = config;

		this.encode = config.encode || EncodeDefault;
		this.decode = config.decode || DecodeDefault;
	}

	abstract listen(): Promise<void>;

	abstract close(): Promise<void>;

	abstract sendMsg(sessionId: string, msg: Object): Promise<boolean>; //发送消息

	abstract offline(session: SocketSession, reason?: string): void;

	receiveMsg(sessionId: string, msg: string | Buffer[]): void {
		this.manager.handleMsg(sessionId, this.decode(msg));
	}

	connect(client: any): string {
		let id = uuid.v4().replace(/-/g, "");
		let session: SocketSession = {
			id,
			client,
		};

		this.sessions.set(id, session);
		this.manager.connect(id, this.id);
		return id;
	}

	//掉线处理
	disconnect(sessionId: string): boolean {
		if (!this.sessions.has(sessionId)) {
			return false;
		}

		this.sessions.delete(sessionId);
		this.channels.forEach(ids => {
			ids = ids.filter(id => {
				return id != sessionId;
			});
		});
		return true;
	}

	//主动掉线
	removeConnect(info: SocketDisConnect): boolean {
		let sessionId = info.sessionId;
		let session = this.getSession(sessionId);
		if (!session) {
			return false;
		}

		this.offline(session, info?.reason);
		this.disconnect(sessionId);

		return true;
	}

	//被动掉线
	dropConnect(sessionId: string, reason: string): boolean {
		let session = this.getSession(sessionId);
		if (!session) {
			return false;
		}

		this.manager.disconnect(sessionId, reason, false);
		this.disconnect(sessionId);
		return true;
	}

	getSession(sessionId: string) {
		return this.sessions.get(sessionId);
	}

	getSessions(): SocketSession[] {
		return [...this.sessions.values()];
	}

	getSessionsByChannel(channel: string): SocketSession[] {
		let channelSessionIds = this.channels.get(channel);
		let list: SocketSession[] = [];

		channelSessionIds?.forEach(item => {
			let session = this.sessions.get(item);
			if (session) {
				list.push(session);
			}
		});

		return list;
	}

	//根据频道广播消息
	joinChannel(sessionId: string, channel: string): void {
		if (!this.channels.has(channel)) {
			this.channels.set(channel, []);
		}

		let channels = this.channels.get(channel);
		if (!channels?.includes(sessionId)) {
			channels?.push(sessionId);
		}
	}

	leaveChannel(sessionId: string, channel: string): void {
		let sessionIds = this.channels.get(channel);
		if (sessionIds) {
			let index = sessionIds.indexOf(sessionId);
			if (index != -1) {
				sessionIds.splice(index, 1);
			}

			if (sessionIds.length == 0) {
				this.channels.delete(channel);
			}
		}
	}

	sendMsgByChannel(channel: string, msg: Object): void {
		let sessionIds = this.channels.get(channel);
		if (sessionIds) {
			sessionIds.forEach(id => {
				this.sendMsg(id, msg);
			});
		}
	}
}
