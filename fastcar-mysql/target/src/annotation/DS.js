"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../type/DesignMeta");
//动态数据源获取 根据就近原则 传入参数-函数-类名
function DS(name) {
    return function (target, methodName, descriptor) {
        if (methodName && descriptor) {
            Reflect.defineMetadata(DesignMeta_1.DesignMeta.ds, name, target, methodName);
        }
        else {
            Reflect.defineMetadata(DesignMeta_1.DesignMeta.ds, name, target.prototype);
        }
    };
}
exports.default = DS;
