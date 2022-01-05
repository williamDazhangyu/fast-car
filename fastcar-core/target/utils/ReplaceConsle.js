"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const levels = ["log", "info", "warn", "error"];
//重构日志
function ReplaceConsle(logger, replaceConsole = false) {
    let beforeFn = levels.map(level => {
        return Reflect.get(console, level);
    });
    levels.forEach((level, index) => {
        Reflect.set(console, level, (...args) => {
            if (!replaceConsole) {
                Reflect.apply(beforeFn[index], beforeFn, args);
            }
            Reflect.apply(Reflect.get(logger, level), logger, args);
        });
    });
}
exports.default = ReplaceConsle;
