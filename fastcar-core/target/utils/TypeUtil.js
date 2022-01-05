"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FileUtil_1 = require("./FileUtil");
class TypeUtil {
    static isFunction(f) {
        let typeName = typeof f;
        return typeName == "function";
    }
    static isClass(f) {
        if (f.prototype === undefined) {
            return false;
        }
        if (!f.prototype.constructor) {
            return false;
        }
        return true;
    }
    static isString(str) {
        let typeName = typeof str;
        return typeName == "string";
    }
    static isObject(f) {
        let typeName = typeof f;
        return typeName == "object";
    }
    static isTSORJS(fp) {
        let suffix = FileUtil_1.default.getSuffix(fp);
        return ["ts", "js"].includes(suffix);
    }
    static isPromise(f) {
        return f.constructor.name === "AsyncFunction";
    }
    static isArray(value) {
        return Array.isArray(value);
    }
    static isDate(value) {
        return value instanceof Date;
    }
}
exports.default = TypeUtil;
