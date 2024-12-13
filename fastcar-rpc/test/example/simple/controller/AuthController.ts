import { SocketServerConfig } from "../../../../src";
import RpcAuthService from "../../../../src/service/RpcAuthService";
import RPCAuth from "../../../../src/annotation/RPCAuth";
import ValidationUtil from "../../../../../fastcar-core/src/utils/ValidationUtil";

@RPCAuth
export default class Auth implements RpcAuthService {
	async auth(username: string, password: string, config: SocketServerConfig): Promise<boolean> {
		if (ValidationUtil.isNotNull(config.secure?.username)) {
			if (config.secure?.username != username) {
				return false;
			}
		}

		if (ValidationUtil.isNotNull(config.secure?.password)) {
			if (config.secure?.password != password) {
				return false;
			}
		}

		return true;
	}
}
