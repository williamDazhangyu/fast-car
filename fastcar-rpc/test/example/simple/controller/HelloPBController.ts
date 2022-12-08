import { Controller, Log } from "@fastcar/core/annotation";
import RPCMethod from "../../../../src/annotation/RPCMethod";
import ProtoData from "../../../../src/annotation/ProtoData";
import { Logger } from "@fastcar/core";
import * as path from "path";

@Controller
@ProtoData(path.join(__dirname, "../../../demo.proto"))
export default class HelloPBController {
	@Log()
	private logger!: Logger;

	@RPCMethod()
	pbhello({ message }: any) {
		this.logger.debug("客户端消息 " + message);
		return {
			code: 200,
			data: "我是一个快乐的rpc by protobuff",
		};
	}
}
