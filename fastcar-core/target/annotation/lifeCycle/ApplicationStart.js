"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BootPriority_1 = require("../../constant/BootPriority");
const LifeCycleModule_1 = require("../../constant/LifeCycleModule");
const Component_1 = require("../stereotype/Component");
/****
 * @version 1.0 在应用启动后自动执行
 * @params order 排序 序号越小排在越前面 系统级的组件 如数据库等一般为0
 * @params exec 执行方法
 */
function ApplicationStart(order = BootPriority_1.BootPriority.Sys, exec = "run") {
    return function (target) {
        if (!Reflect.has(target.prototype, exec)) {
            throw new Error(`${target.name} has no implementation ${exec} method`);
        }
        Component_1.default(target);
        Reflect.defineMetadata(LifeCycleModule_1.LifeCycleModule.ApplicationStart, {
            order,
            exec,
        }, target.prototype);
    };
}
exports.default = ApplicationStart;
