// import { Middleware } from "./src/type/RpcConfig";
// import ComposeService from "./src/service/ComposeService";
// let middleware: Middleware[] = [];

// middleware.push(async (ctx, next: Function) => {
// 	console.log(1);
// 	await next();
// 	console.log(2);
// });

// middleware.push(async (ctx, next: Function) => {
// 	console.log(3);
// 	await next();
// 	console.log(4);
// });

// let fn = ComposeService(middleware);
// console.log(
// 	fn(
// 		{
// 			sessionId: "",
// 			serverId: "",
// 			connectedTime: Date.now(),
// 			settings: new Map(),
// 			url: "123",
// 		},
// 		function res() {
// 			console.log(res);
// 		}
// 	)
// );
