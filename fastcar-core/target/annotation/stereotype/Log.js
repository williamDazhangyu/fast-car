"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
// import Logger from "../../interface/Logger";
//日志实例
function Log(category) {
    return function (target, propertyKey) {
        // const designType = Reflect.getMetadata(FastCarMetaData.designType, target, propertyKey);
        // if (designType != Logger) {
        // 	console.error(`${propertyKey} does not belong to Logger type`);
        // 	return;
        // }
        let m = category || propertyKey;
        if (Reflect.hasMetadata(FastCarMetaData_1.FastCarMetaData.LoggerModule, target)) {
            let loggerMap = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.LoggerModule, target);
            loggerMap.set(propertyKey, m);
        }
        else {
            let modules = new Map();
            modules.set(propertyKey, m);
            Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.LoggerModule, modules, target);
        }
    };
}
exports.default = Log;
