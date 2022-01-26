"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
//应用别名声明
function BeanName(name) {
    return function (target) {
        //生成别名 用于逻辑识别
        Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.Alias, name, target); //放入至原型中
    };
}
exports.default = BeanName;
