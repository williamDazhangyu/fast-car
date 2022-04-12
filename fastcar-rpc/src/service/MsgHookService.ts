import { Logger } from "fastcar-core";
import { SessionId, ClientSession } from "../types/SocketConfig";
import { ServerConfig, ServerType } from "fastcar-server";

//消息钩子
export default interface MsgHookService {
	connect(sessionId: SessionId): void;

	disconnect(sessionId: SessionId, reason: string, force?: boolean): void;

	handleMsg(sessionId: SessionId, msg: Object): void;

	getLogger(): Logger;

	//在连接前进行用户身份验证
	auth(username: string, password: string, session: ClientSession): Promise<boolean>;

	// 创建会话
	createSession(serverId: string): ClientSession;

	//销毁会话
	deleteSession(sessionId: SessionId): void;

	getClientSession(sessionId: SessionId): ClientSession | null;

	//获取一个网络服务器
	createNetServer(config: ServerConfig, cb?: any): ServerType;
}
