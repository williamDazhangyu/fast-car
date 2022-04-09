import { Controller } from "fastcar-core/annotation";
import RPC from "../../../../src/annotation/RPC";
import RPCMethod from "../../../../src/annotation/RPCMethod";

@Controller
@RPC("/head")
export default class HeadController {
	@RPCMethod()
	hello() {
		return {
			code: 200,
			data: "追加了头的url",
		};
	}
}
