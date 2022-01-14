import { Controller } from "fastcar-core/annotation";
import GetMapping from "../../../src/annotation/router/GetMapping";

@Controller
export default class HelloController {
	hello: string = "hello";

	@GetMapping("/getHello")
	getHello(data: any) {
		return {
			code: 200,
			data: this.hello,
		};
	}

	@GetMapping("/getError")
	getError() {
		throw new Error("test error");
	}
}
