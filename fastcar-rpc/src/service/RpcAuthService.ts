import { SocketServerConfig } from "../types/SocketConfig";

export default interface RpcAuthService {
	auth(username: string, password: string, config: SocketServerConfig, request?: any): Promise<boolean>;
}
