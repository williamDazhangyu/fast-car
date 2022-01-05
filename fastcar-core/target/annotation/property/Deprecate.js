"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DEFAULT_MSG = "This function will be removed in future versions.";
/****
 * @version 1.0 用于标记弃用
 */
function Deprecate(msg = DEFAULT_MSG) {
    return function (target, prop, descriptor) {
        console.warn(prop ? prop : Reflect.get(target, "name"), msg);
        if (descriptor) {
            const fn = descriptor.value;
            descriptor.value = function (...args) {
                console.warn(prop, msg);
                return Reflect.apply(fn, this, args);
            };
        }
    };
}
exports.default = Deprecate;
