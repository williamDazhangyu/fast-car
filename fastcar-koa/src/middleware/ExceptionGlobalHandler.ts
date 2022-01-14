import { FastCarApplication } from "fastcar-core";
//默认错误捕捉
export default function ExceptionGlobalHandler(app: FastCarApplication) {
	let logger = app.getSysLogger();
	return async (ctx: any, next: Function) => {
		try {
			await next();
		} catch (e) {
			logger.error(`${ctx.url} is error`);
			if (e) {
				logger.error(e);
			}
			ctx.body = {
				code: 500,
				msg: "Service internal error",
			};
		}
	};
}
