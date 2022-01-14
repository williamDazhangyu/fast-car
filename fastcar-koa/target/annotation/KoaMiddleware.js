"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../type/DesignMeta");
const fastcar_core_1 = require("fastcar-core");
//加载koa中间件
function KoaMiddleware(...args) {
    return function (target) {
        let middlewareList = Reflect.getMetadata(DesignMeta_1.DesignMeta.KoaMIDDLEWARE, fastcar_core_1.FastCarApplication.prototype);
        if (!middlewareList) {
            middlewareList = args;
        }
        else {
            //由于注解方式是从下至上运行 和我们理解的书写习惯不一样，所以这边做了一个反序
            middlewareList = [...args, ...middlewareList];
        }
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.KoaMIDDLEWARE, middlewareList, fastcar_core_1.FastCarApplication.prototype);
    };
}
exports.default = KoaMiddleware;
