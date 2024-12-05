import { FastCarApplication, ValidError } from "@fastcar/core";

//默认错误捕捉
export default function ExceptionGlobalHandler(app: FastCarApplication) {
	const logger = app.getSysLogger();
	return async (ctx: any, next: Function) => {
		try {
			await next();
		} catch (e) {
			//新增如果是校验的错误则进行输出
			if (e instanceof ValidError) {
				ctx.body = {
					code: 400,
					msg: e.message || "parameter error",
				};
			} else {
				logger.error(`${ctx.url} is error`);
				if (e) {
					logger.error(e);
				}
				ctx.body = {
					code: 500,
					msg: "Service internal error",
				};
			}
		}
	};
}
