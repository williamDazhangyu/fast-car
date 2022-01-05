"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @version 1.0 用于标记只读 可作用于属性或者方法
 */
function Readonly(target, methodName, descriptor) {
    if (!descriptor) {
        Reflect.defineProperty(target, methodName, {
            writable: false,
        });
    }
    else {
        descriptor.writable = false;
    }
}
exports.default = Readonly;
