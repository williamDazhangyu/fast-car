"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SysConfig_1 = require("../config/SysConfig");
const log4js = require("log4js");
//注入日志组件
function Log(config = SysConfig_1.LogDefaultConfig) {
    return function (target) {
        let existConfig = Reflect.get(target.prototype, "log4js");
        if (existConfig) {
            Object.assign(existConfig.appenders, config.appenders);
            Object.assign(existConfig.categories, config.categories);
        }
        else {
            existConfig = Object.assign({}, config);
            Reflect.set(target.prototype, "log4js", config);
        }
        log4js.configure(config);
    };
}
exports.default = Log;
