"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormValidationUtil = void 0;
const Format_1 = require("./Format");
const TypeUtil_1 = require("./TypeUtil");
//表单校验器
class FormValidationUtil {
    //是否为空
    static isNotNull(param) {
        if (param != undefined && param != null) {
            if (TypeUtil_1.default.isString(param)) {
                return param.length > 0;
            }
            if (TypeUtil_1.default.isObject(param)) {
                return Reflect.ownKeys(param).length > 0;
            }
            return true;
        }
        else {
            return false;
        }
    }
    static isNull(param) {
        return !FormValidationUtil.isNotNull(param);
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
        if (FormValidationUtil.isString(param)) {
            return param.length <= value;
        }
        if (FormValidationUtil.isNumber(param)) {
            return param <= value;
        }
        if (FormValidationUtil.isBoolean(param)) {
            return true;
        }
        let v = FormValidationUtil.isNotNull(param) ? param.toString() : "";
        return v.length <= value;
    }
    static isNotMinSize(param, value) {
        if (FormValidationUtil.isString(param)) {
            return param.length >= value;
        }
        if (FormValidationUtil.isNumber(param)) {
            return param >= value;
        }
        if (FormValidationUtil.isBoolean(param)) {
            return true;
        }
        let v = FormValidationUtil.isNotNull(param) ? param.toString() : "";
        return v.length >= value;
    }
    static isArray(param, type) {
        if (!Array.isArray(param)) {
            return false;
        }
        let UpType = Format_1.default.formatFirstToUp(type);
        let m = `is${UpType}`;
        //如果没有该方法 则返回true
        if (!Reflect.has(FormValidationUtil, m)) {
            return true;
        }
        if (Reflect.has(FormValidationUtil, m)) {
            return param.every(item => {
                return Reflect.apply(Reflect.get(FormValidationUtil, m), FormValidationUtil, [item]);
            });
        }
        return false;
    }
    static checkType(param, type) {
        //判定类型
        if (type.startsWith("array")) {
            let ntype = type.replace(/array/, "");
            return FormValidationUtil.isArray(param, ntype);
        }
        let formatFun = null;
        switch (type) {
            case "string": {
                formatFun = FormValidationUtil.isString;
                break;
            }
            case "boolean": {
                formatFun = FormValidationUtil.isBoolean;
                break;
            }
            case "int":
            case "float":
            case "number": {
                formatFun = FormValidationUtil.isNumber;
                break;
            }
            case "date": {
                formatFun = FormValidationUtil.isDate;
                break;
            }
            default: {
                return true;
            }
        }
        return Reflect.apply(formatFun, FormValidationUtil, [param, type]);
    }
}
exports.FormValidationUtil = FormValidationUtil;
