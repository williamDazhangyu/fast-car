"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ComponentKind_1 = require("../../constant/ComponentKind");
const Injection_1 = require("./Injection");
function Component(target) {
    Injection_1.default(target, ComponentKind_1.ComponentKind.Component);
}
exports.default = Component;
