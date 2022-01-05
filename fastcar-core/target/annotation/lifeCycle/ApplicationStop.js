"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BootPriority_1 = require("../../constant/BootPriority");
const LifeCycleModule_1 = require("../../constant/LifeCycleModule");
const Component_1 = require("../stereotype/Component");
//在应用停止前触发
function ApplicationStop(order = BootPriority_1.BootPriority.Sys, exec = "run") {
    return function (target) {
        if (!Reflect.has(target.prototype, exec)) {
            throw new Error(`${target.name} has no implementation ${exec} method`);
        }
        Component_1.default(target);
        Reflect.defineMetadata(LifeCycleModule_1.LifeCycleModule.ApplicationStop, {
            order,
            exec,
        }, target.prototype);
    };
}
exports.default = ApplicationStop;
