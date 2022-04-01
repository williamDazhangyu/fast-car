import { SessionId } from "../type/SocketConfig";

//消息钩子
export default interface MsgHookService {
	connect(sessionId: SessionId, serverId?: string): void; //当一个session存在于不同实现中时必填

	disconnect(sessionId: SessionId, reason: string, force?: boolean): void;

	handleMsg(sessionId: SessionId, msg: Object): void;
}
