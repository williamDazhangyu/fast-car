"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommonConstant_1 = require("../../constant/CommonConstant");
const fs = require("fs");
//设置运行是的主路径
function BasePath(name) {
    return function (target) {
        let stats = fs.statSync(name);
        if (stats.isDirectory()) {
            Reflect.set(global, CommonConstant_1.CommonConstant.BasePath, name);
        }
    };
}
exports.default = BasePath;
