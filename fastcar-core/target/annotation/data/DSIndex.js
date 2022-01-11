"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
//用于标记数据源位置
function DSIndex(target, name, index) {
    Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.DSIndex, index, target, name);
}
exports.default = DSIndex;
