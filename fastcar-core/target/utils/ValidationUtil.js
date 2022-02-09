"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FormatStr_1 = require("./FormatStr");
const TypeUtil_1 = require("./TypeUtil");
//类型校验器
class ValidationUtil {
    //是否为空
    static isNotNull(param) {
        if (param != undefined && param != null) {
            if (TypeUtil_1.default.isString(param)) {
                return param.length > 0;
            }
            if (TypeUtil_1.default.isObject(param)) {
                if (TypeUtil_1.default.isDate(param)) {
                    return true;
                }
                return Reflect.ownKeys(param).length > 0;
            }
            return true;
        }
        else {
            return false;
        }
    }
    static isNull(param) {
        return !ValidationUtil.isNotNull(param);
    }
    static isNumber(param) {
        return typeof param === "number" && !isNaN(param);
    }
    static isString(param) {
        return typeof param === "string";
    }
    static isBoolean(param) {
        return typeof param === "boolean";
    }
    static isDate(param) {
        return param instanceof Date;
    }
    static isObject(param) {
        return typeof param == "object";
    }
    // poaram >= value
    static isNotMinSize(param, value) {
        if (ValidationUtil.isString(param)) {
            return param.length >= value;
        }
        if (ValidationUtil.isNumber(param)) {
            return param >= value;
        }
        if (ValidationUtil.isBoolean(param)) {
            return true;
        }
        let v = ValidationUtil.isNotNull(param) ? param.toString() : "";
        return v.length >= value;
    }
    static isNotMaxSize(param, value) {
        return !ValidationUtil.isNotMinSize(param, value + 1);
    }
    static isArray(param, type) {
        if (!Array.isArray(param)) {
            return false;
        }
        let UpType = FormatStr_1.default.formatFirstToUp(type);
        let m = `is${UpType}`;
        //如果没有该方法 则返回true
        if (!Reflect.has(ValidationUtil, m)) {
            return true;
        }
        let checkFun = Reflect.get(ValidationUtil, m);
        return param.every(item => {
            return Reflect.apply(checkFun, ValidationUtil, [item]);
        });
    }
    static getCheckFun(type) {
        //判定类型
        if (type.startsWith("array")) {
            return ValidationUtil.isArray;
        }
        let formatFun = null;
        switch (type) {
            case "string": {
                formatFun = ValidationUtil.isString;
                break;
            }
            case "boolean": {
                formatFun = ValidationUtil.isBoolean;
                break;
            }
            case "object": {
                formatFun = ValidationUtil.isObject;
                break;
            }
            case "int":
            case "float":
            case "number": {
                formatFun = ValidationUtil.isNumber;
                break;
            }
            case "date": {
                formatFun = ValidationUtil.isDate;
                break;
            }
            default: {
                break;
            }
        }
        return formatFun;
    }
    static checkType(param, type) {
        let formatFun = ValidationUtil.getCheckFun(type);
        if (!formatFun) {
            return false;
        }
        return Reflect.apply(formatFun, ValidationUtil, [param, type]);
    }
}
exports.default = ValidationUtil;
