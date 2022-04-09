import { Autowired, Controller } from "fastcar-core/annotation";
import RPCMethod from "../../../../src/annotation/RPCMethod";
import RpcServer from "../../../../src/service/rpc/RpcServer";
import { ClientSession } from "../../../../src/types/SocketConfig";

type DisconnectType = {
	session: ClientSession;
	reason: string;
};

@Controller
export default class HelloController {
	@Autowired
	private rpcServer!: RpcServer;

	@RPCMethod()
	connect(session: ClientSession) {
		console.log("connect-----", session.sessionId);
		// //也可以这这里做一些权限校验的工作 如果不对则直接ko
		// this.rpcServer.kickSessionId(session.sessionId, "强制下线");
		return {
			code: 200,
			data: "socket is connect",
		};
	}

	@RPCMethod()
	disconnect({ session, reason }: DisconnectType) {
		console.log("disconnect-----", session.sessionId, reason);
		return {
			code: 200,
		};
	}
}
