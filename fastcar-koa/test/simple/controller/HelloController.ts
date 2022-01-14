import { Controller } from "fastcar-core/annotation";
import GetMapping from "../../../src/annotation/router/GetMapping";
import PostMapping from "../../../src/annotation/router/PostMapping";
import RequestMapping from "../../../src/annotation/router/RequestMapping";

@Controller
@RequestMapping("/test") //允许头部追加url
export default class HelloController {
	hello: string = "hello";

	//支持多种http的请求方式
	@GetMapping("/getHello")
	@PostMapping("/getHello")
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
