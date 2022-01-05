"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ComponentKind_1 = require("../../constant/ComponentKind");
const Injection_1 = require("./Injection");
//中间服务层
function Service(target) {
    Injection_1.default(target, ComponentKind_1.ComponentKind.Service);
}
exports.default = Service;
