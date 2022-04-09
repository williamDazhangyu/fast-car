import { Controller } from "fastcar-core/annotation";
import RPCMethod from "../../../../src/annotation/RPCMethod";

@Controller
export default class HelloController {
	@RPCMethod()
	hello() {
		return {
			code: 200,
			data: "我是一个快乐的rpc",
		};
	}

	@RPCMethod()
	async asynchello() {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					code: 200,
					data: "这是一个异步rpc",
				});
			}, 200);
		});
	}
}
