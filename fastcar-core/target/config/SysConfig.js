"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogDefaultConfig = exports.SYSDefaultConfig = void 0;
exports.SYSDefaultConfig = {
    application: {
        name: "app",
        env: "development",
        version: "1.0.0",
        hotter: false,
    },
    settings: new Map(), //自定义配置
};
exports.LogDefaultConfig = {
    consoleLevel: "info",
    fileLevel: "info",
    rootPath: __dirname,
    maxsize: 1024 * 1024 * 10,
    maxFiles: 30,
    printConsole: true,
};
