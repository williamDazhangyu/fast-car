"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ComponentKind_1 = require("../../constant/ComponentKind");
const Injection_1 = require("./Injection");
//数据逻辑层(表明和数据库相关)
function Repository(target) {
    Injection_1.default(target, ComponentKind_1.ComponentKind.Repository);
}
exports.default = Repository;
