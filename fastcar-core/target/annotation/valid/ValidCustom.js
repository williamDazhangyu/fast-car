"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AddChildValid_1 = require("./AddChildValid");
//自定义表单校验
function ValidCustom(fn, message) {
    return function (target, propertyKey) {
        AddChildValid_1.default(target, propertyKey, {
            filters: [
                {
                    fn,
                    message,
                },
            ],
        });
    };
}
exports.default = ValidCustom;
