import { Middleware, RpcContext } from "../types/RpcConfig";

//洋葱模型调用函数
export default function ComposeService(middleware: Middleware[]) {
	if (middleware.length == 0) {
		throw new Error("middleware cannot be empty");
	}

	let flag = middleware.every((item) => {
		return typeof item == "function";
	});

	if (!flag) {
		throw new Error("middleware must be full of arrays");
	}

	return function (context: RpcContext, next?: Middleware) {
		let index = -1;
		function dispatch(i: number): any {
			if (i <= index) {
				//保证依然是前一个的次序
				return Promise.reject(new Error("next() called multiple times"));
			}

			index = i;
			let fn = middleware[i];

			//保证每次都可以调用到最后的 如果有的话
			if (i === middleware.length && next) {
				fn = next;
			}

			if (!fn) {
				return Promise.resolve();
			}

			try {
				return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
			} catch (err) {
				return Promise.reject(err);
			}
		}

		return dispatch(0);
	};
}
