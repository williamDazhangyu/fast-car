"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//默认错误捕捉
function ExceptionGlobalHandler(app) {
    let logger = app.getSysLogger();
    return async (ctx, next) => {
        try {
            await next();
        }
        catch (e) {
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
exports.default = ExceptionGlobalHandler;
