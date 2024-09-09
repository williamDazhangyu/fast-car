import { ClientSession, SocketServerConfig } from "../types/SocketConfig";

export default interface RpcAuthService {
	auth(username: string, password: string, config: SocketServerConfig, session: ClientSession, request?: any): Promise<boolean>;

	auth(username: string, password: string, config: SocketServerConfig, request?: any): Promise<boolean>;
}
