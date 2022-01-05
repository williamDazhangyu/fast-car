"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Format_1 = require("./Format");
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
                return Reflect.ownKeys(param.name).length > 0;
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
        return typeof param === "number";
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
    static isNotMaxSize(param, value) {
        if (ValidationUtil.isString(param)) {
            return param.length <= value;
        }
        if (ValidationUtil.isNumber(param)) {
            return param <= value;
        }
        if (ValidationUtil.isBoolean(param)) {
            return true;
        }
        let v = ValidationUtil.isNotNull(param) ? param.toString() : "";
        return v.length <= value;
    }
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
    static isArray(param, type) {
        if (!Array.isArray(param)) {
            return false;
        }
        let UpType = Format_1.default.formatFirstToUp(type);
        let m = `is${UpType}`;
        //如果没有该方法 则返回true
        if (!Reflect.has(ValidationUtil, m)) {
            return true;
        }
        if (Reflect.has(ValidationUtil, m)) {
            return param.every(item => {
                return Reflect.apply(Reflect.get(ValidationUtil, m), ValidationUtil, [item]);
            });
        }
        return false;
    }
    static checkType(param, type) {
        //判定类型
        if (type.startsWith("array")) {
            let ntype = type.replace(/array/, "");
            return ValidationUtil.isArray(param, ntype);
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
                return true;
            }
        }
        return Reflect.apply(formatFun, ValidationUtil, [param, type]);
    }
}
exports.default = ValidationUtil;
ValidationUtil.isNotNull(new Date());
