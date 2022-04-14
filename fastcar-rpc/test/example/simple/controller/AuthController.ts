import { SocketServerConfig } from "../../../../src";
import RpcAuthService from "../../../../src/service/RpcAuthService";
import RPCAuth from "../../../../src/annotation/RPCAuth";

@RPCAuth
export default class Auth implements RpcAuthService {
	async auth(username: string, password: string, config: SocketServerConfig): Promise<boolean> {
		return config.secure?.username == username && config.secure.password == password;
	}
}
