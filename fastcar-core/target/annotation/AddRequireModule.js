"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FastCarMetaData_1 = require("../constant/FastCarMetaData");
require("reflect-metadata");
/***
 * @version 1.0 依赖模块注入
 *
 */
function AddRequireModule(target, m, alias) {
    let relyname = FastCarMetaData_1.FastCarMetaData.IocModule;
    if (Reflect.hasMetadata(relyname, target)) {
        let iocMap = Reflect.getMetadata(relyname, target);
        iocMap.set(m, alias);
    }
    else {
        let modules = new Map();
        modules.set(m, alias);
        Reflect.defineMetadata(relyname, modules, target);
    }
}
exports.default = AddRequireModule;
