"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FastCarApplication_1 = require("../../FastCarApplication");
//加载特殊组件手动注入
function SpecifyCompent(m) {
    return function (target) {
        FastCarApplication_1.default.setSpecifyCompent(m);
    };
}
exports.default = SpecifyCompent;
