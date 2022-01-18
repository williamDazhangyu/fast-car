"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastcar_core_1 = require("fastcar-core");
//默认错误捕捉
function ExceptionGlobalHandler(app) {
    let logger = app.getSysLogger();
    return async (ctx, next) => {
        try {
            await next();
        }
        catch (e) {
            //新增如果是校验的错误则进行输出
            if (e instanceof fastcar_core_1.ValidError) {
                ctx.body = {
                    code: 400,
                    msg: e.message || "parameter error",
                };
            }
            else {
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
exports.default = ExceptionGlobalHandler;
