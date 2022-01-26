"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const CryptoUtil_1 = require("../../utils/CryptoUtil");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
function Injection(target, name) {
    //生成别名 避免名称重复的情况
    let key = `${name}:${CryptoUtil_1.default.getHashStr()}`;
    Reflect.defineMetadata(name, true, target.prototype);
    Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.InjectionUniqueKey, key, target); //放入至原型中
}
exports.default = Injection;
