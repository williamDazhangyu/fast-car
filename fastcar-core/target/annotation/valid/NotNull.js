"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AddChildValid_1 = require("./AddChildValid");
//是否为非空字段
function NotNull(target, propertyKey, index) {
    AddChildValid_1.default(target, propertyKey, { required: true }, index);
}
exports.default = NotNull;
