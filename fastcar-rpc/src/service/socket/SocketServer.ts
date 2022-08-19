import { SocketDisConnect, SocketServerConfig, SocketSession, SessionId, EncodeMsg, DecodeMsg } from "../../types/SocketConfig";
import MsgHookService from "../MsgHookService";
import { DecodeDefault, EncodeDefault, EncodePBDefault, DecodePBDefault } from "../../constant/SocketCodingDefault";
import { RpcMessage } from "../../types/RpcConfig";
import { CodeProtocolEnum } from "../../types/CodeProtocolEnum";

//这边主要做对于各个集成的socket的一个约定
export default abstract class SocketServer {
	protected id: string;
	protected sessions: Map<SessionId, SocketSession>; //会话绑定
	protected manager: MsgHookService; //管理端
	protected state: boolean;
	protected config: SocketServerConfig;
	protected encode: EncodeMsg;
	protected decode: DecodeMsg;

	constructor(config: SocketServerConfig, manager: MsgHookService) {
		this.id = config.id;
		this.sessions = new Map();
		this.manager = manager;
		this.state = false;
		this.config = config;

		switch (config.codeProtocol) {
			case CodeProtocolEnum.PROTOBUF: {
				this.encode = EncodePBDefault;
				this.decode = DecodePBDefault;
				break;
			}
			case CodeProtocolEnum.JSON:
			default: {
				this.encode = EncodeDefault;
				this.decode = DecodeDefault;
				break;
			}
		}

		if (config.encode) {
			this.encode = config.encode;
		}

		if (config.decode) {
			this.decode = config.decode;
		}
	}

	abstract listen(): Promise<void>;

	abstract close(): Promise<void>;

	abstract sendMsg(sessionId: string, msg: RpcMessage): Promise<boolean>; //发送消息

	abstract offline(session: SocketSession, reason?: string): void;

	async sendMsgBySessionId(sessionId: string, msg: RpcMessage) {
		return await this.sendMsg(sessionId, msg);
	}

	receiveMsg(sessionId: string, msg: string | Buffer | ArrayBuffer | Buffer[]): void {
		this.manager.handleMsg(sessionId, this.decode(msg));
	}

	connect(client: any, id: SessionId, remoteAddress: string): void {
		let session: SocketSession = {
			id: id,
			client,
			remoteAddress,
		};

		this.sessions.set(id, session);
		this.manager.connect(id);
	}

	//掉线处理
	disconnect(sessionId: string): boolean {
		if (!this.sessions.has(sessionId)) {
			return false;
		}

		this.sessions.delete(sessionId);
		return true;
	}

	//主动掉线
	kickConnect(info: SocketDisConnect): boolean {
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

	getConfig() {
		return this.config;
	}
}
