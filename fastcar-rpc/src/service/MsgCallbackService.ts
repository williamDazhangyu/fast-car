import { ClientSession } from "../types/SocketConfig";

//消息钩子
export default interface MsgCallbackService {
	disconnect(session: ClientSession, reason: string): void;

	handleMsg(session: ClientSession, msg: Object): void;

	auth(username: string, password: string, session: ClientSession): Promise<boolean>;
}
