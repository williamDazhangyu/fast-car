"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ComponentKind_1 = require("../../constant/ComponentKind");
const Injection_1 = require("./Injection");
//业务逻辑层
function Controller(target) {
    Injection_1.default(target, ComponentKind_1.ComponentKind.Controller);
}
exports.default = Controller;
