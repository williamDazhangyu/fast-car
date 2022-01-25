"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AddChildValid_1 = require("./AddChildValid");
//校验长度
function Size(m = { minSize: 0, maxSize: 0 }) {
    return function (target, propertyKey, index) {
        AddChildValid_1.default(target, propertyKey, m, index);
    };
}
exports.default = Size;
