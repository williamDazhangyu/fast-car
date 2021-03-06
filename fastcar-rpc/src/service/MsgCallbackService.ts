import { ClientSession, ServerId } from "../types/SocketConfig";

//消息钩子
export default interface MsgCallbackService {
	connect(session: ClientSession): void; //当一个session存在于不同实现中时必填

	disconnect(session: ClientSession, reason: string): void;

	handleMsg(session: ClientSession, msg: Object): void;

	auth(username: string, password: string, session: ClientSession): Promise<boolean>;
}
