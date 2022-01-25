"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AddChildValid_1 = require("./AddChildValid");
//自定义表单校验
function ValidCustom(fn, message) {
    return function (target, propertyKey, index) {
        AddChildValid_1.default(target, propertyKey, {
            filters: [
                {
                    fn,
                    message,
                },
            ],
        }, index);
    };
}
exports.default = ValidCustom;
