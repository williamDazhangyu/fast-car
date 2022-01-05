"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogDefaultConfig = exports.SYSDefaultConfig = void 0;
exports.SYSDefaultConfig = {
    application: {
        name: "FAST_CAR",
        env: "development",
    },
    settings: new Map(), //自定义配置
};
exports.LogDefaultConfig = {
    appenders: {
        sysLogger: {
            type: "console",
        },
    },
    categories: { default: { appenders: ["sysLogger"], level: "ALL" } },
};
