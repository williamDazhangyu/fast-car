"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process = require("process");
//异常监听器
function ExceptionMonitor(target) {
    process.on("uncaughtException", (err, origin) => {
        console.error(`Caught exception: ${err.message}`);
        console.error(`Exception origin: ${origin}`);
        console.error(`stack: ${err.stack}`);
    });
    process.on("unhandledRejection", (reason, promise) => {
        console.error("Unhandled Rejection at:", promise);
        console.error("reason:", reason);
    });
}
exports.default = ExceptionMonitor;
