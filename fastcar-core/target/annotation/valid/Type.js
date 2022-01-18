"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AddChildValid_1 = require("./AddChildValid");
//表明类型
function Type(type) {
    return function (target, propertyKey) {
        AddChildValid_1.default(target, propertyKey, { type: type.toLowerCase() });
    };
}
exports.default = Type;
