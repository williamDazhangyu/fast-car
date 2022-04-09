import ComposeService from "../src/service/ComposeService";
import { InteractiveMode, Middleware, RpcContext } from "../src/types/RpcConfig";

describe("中间件测试", () => {
	it("中间件示例", async () => {
		let middleware: Middleware[] = [];

		middleware.push(async (ctx: RpcContext, next?: Function) => {
			console.log(1);
			if (next) {
				await next();
			}
			console.log(2);
		});

		middleware.push(async (ctx: RpcContext, next?: Function) => {
			console.log(3);
			if (next) {
				await next();
			}
			console.log(4);
		});
		let fn = ComposeService(middleware);
		await fn({
			sessionId: "",
			serverId: "",
			connectedTime: Date.now(),
			settings: new Map(),
			mode: InteractiveMode.request,
			url: "/test",
		});

		// await fn({
		// 	sessionId: "",
		// 	serverId: "",
		// 	connectedTime: Date.now(),
		// 	settings: new Map(),
		// 	mode: InteractiveMode.request,
		// 	url: "/test2",
		// });
	});
});
