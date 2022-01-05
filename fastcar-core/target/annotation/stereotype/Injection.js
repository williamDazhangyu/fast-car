"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const FastCarApplication_1 = require("../../FastCarApplication");
function Injection(target, name) {
    Reflect.defineMetadata(name, true, target.prototype);
    FastCarApplication_1.default.setInjectionMap(target.name);
}
exports.default = Injection;
