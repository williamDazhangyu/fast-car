"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AddChildValid_1 = require("./AddChildValid");
//默认值获取
function DefaultVal(val) {
    return function (target, propertyKey, index) {
        AddChildValid_1.default(target, propertyKey, { defaultVal: val }, index);
    };
}
exports.default = DefaultVal;
