"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommonConstant_1 = require("../../constant/CommonConstant");
//设置初始化的env 注入在原始的application上面
function ENV(name) {
    return function (target) {
        Reflect.set(target.prototype, CommonConstant_1.CommonConstant.ENV, name);
    };
}
exports.default = ENV;
