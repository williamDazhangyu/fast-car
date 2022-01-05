"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidForm = exports.IsArray = exports.IsBoolean = exports.IsString = exports.IsNumber = exports.Size = exports.NotNull = exports.EnableForm = exports.EnableParseMap = exports.isValidError = void 0;
const ValidationUtil_1 = require("../utils/ValidationUtil");
const TypeUtil_1 = require("../utils/TypeUtil");
const DataFormat_1 = require("../utils/DataFormat");
class ValidError extends Error {
}
function isValidError(err) {
    return err instanceof ValidError;
}
exports.isValidError = isValidError;
function getFunctionArgsName(fn) {
    if (!TypeUtil_1.default.isFunction(fn)) {
        return [];
    }
    let str = fn.toString();
    let startIndex = str.indexOf("(");
    let endIndex = str.indexOf(")");
    let params = str.substring(startIndex + 1, endIndex);
    let paramList = params.split(",").map(item => {
        let tmpIndex = item.indexOf("=");
        if (tmpIndex > -1) {
            item = item.substring(0, tmpIndex);
        }
        return item.trim();
    });
    return paramList;
}
//开启解析参数 将一个对象内的参数解析为多个参数
function EnableParseMap(target, methodName, descriptor) {
    let targetFn = descriptor.value;
    let paramsMap = getFunctionArgsName(targetFn);
    descriptor.value = function (...args) {
        let newArgs = Array.of();
        for (let param of paramsMap) {
            let addValue = null;
            for (let arg of args) {
                if (TypeUtil_1.default.isObject(arg)) {
                    if (Reflect.has(arg, param)) {
                        addValue = arg[param];
                        break;
                    }
                }
            }
            newArgs.push(addValue);
        }
        return Reflect.apply(targetFn, this, newArgs);
    };
}
exports.EnableParseMap = EnableParseMap;
//是否开启规则校验
function EnableForm(target, methodName, descriptor) {
    let targetFn = descriptor.value;
    let rules = Reflect.get(target[methodName], "formRules");
    descriptor.value = function (...args) {
        if (Array.isArray(rules)) {
            for (let rule of rules) {
                let value = args[rule.index];
                //查看是否校验子属性
                if (ValidationUtil_1.default.isNotNull(value)) {
                    if (rule?.prop) {
                        if (Reflect.has(value, rule.prop)) {
                            value = value[rule.prop];
                        }
                        else {
                            if (Reflect.has(rule, rule.defaultValue)) {
                                value = rule.defaultValue;
                            }
                            else {
                                value = null;
                            }
                        }
                    }
                }
                //忽略空值
                if (ValidationUtil_1.default.isNull(value) && rule.fn.name != "isNotNull") {
                    continue;
                }
                //进行check校验
                let flag = Reflect.apply(rule.fn, this, [value, ...rule.args]);
                if (!flag) {
                    //抛出错误提示
                    let errorMsg = new ValidError(rule.message ? rule.message : `The ${rule.prop ? rule.prop : rule.index} parameter is invalid ${value} call by ${methodName}`);
                    return errorMsg;
                }
            }
        }
        return Reflect.apply(targetFn, this, args);
    };
}
exports.EnableForm = EnableForm;
function addRules(obj, rule) {
    if (!obj.formRules) {
        obj.formRules = Array.of();
    }
    obj.formRules.push(rule);
}
function NotNull(m = {}) {
    return function (target, methodName, paramIndex) {
        addRules(target[methodName], {
            index: paramIndex,
            fn: ValidationUtil_1.default.isNotNull,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue,
        });
    };
}
exports.NotNull = NotNull;
function Size({ min = 0, max = 0, message = "", prop, defaultValue }) {
    return function (target, methodName, paramIndex) {
        addRules(target[methodName], {
            index: paramIndex,
            fn: ValidationUtil_1.default.isNotMaxSize,
            args: [max],
            message,
            prop,
            defaultValue,
        });
        addRules(target[methodName], {
            index: paramIndex,
            fn: ValidationUtil_1.default.isNotMinSize,
            args: [min],
            message,
            prop,
            defaultValue,
        });
    };
}
exports.Size = Size;
function IsNumber(m = {}) {
    return function (target, methodName, paramIndex) {
        addRules(target[methodName], {
            index: paramIndex,
            fn: ValidationUtil_1.default.isNumber,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue,
        });
    };
}
exports.IsNumber = IsNumber;
function IsString(m = {}) {
    return function (target, methodName, paramIndex) {
        addRules(target[methodName], {
            index: paramIndex,
            fn: ValidationUtil_1.default.isString,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue,
        });
    };
}
exports.IsString = IsString;
function IsBoolean(m = {}) {
    return function (target, methodName, paramIndex) {
        addRules(target[methodName], {
            index: paramIndex,
            fn: ValidationUtil_1.default.isBoolean,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue,
        });
    };
}
exports.IsBoolean = IsBoolean;
function IsArray(m = {}, type = "string") {
    return function (target, methodName, paramIndex) {
        addRules(target[methodName], {
            index: paramIndex,
            fn: ValidationUtil_1.default.isArray,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue,
        });
    };
}
exports.IsArray = IsArray;
function getFormValue(args, prop, paramIndex = 0, defaultValue) {
    let value = args[paramIndex];
    //查看是否校验子属性
    if (ValidationUtil_1.default.isNotNull(value)) {
        if (ValidationUtil_1.default.isNotNull(prop)) {
            if (Reflect.has(value, prop)) {
                return value[prop];
            }
        }
    }
    if (ValidationUtil_1.default.isNotNull(defaultValue)) {
        return defaultValue;
    }
    return null;
}
function delFormValue(args, prop, paramIndex = 0) {
    let value = args[paramIndex];
    //查看是否校验子属性
    if (ValidationUtil_1.default.isNotNull(value)) {
        if (Reflect.has(value, prop)) {
            Reflect.deleteProperty(value, prop);
        }
    }
}
function setFormValue(args, prop, paramIndex = 0, val) {
    //查看是否校验子属性
    if (ValidationUtil_1.default.isNotNull(args[paramIndex]) || TypeUtil_1.default.isObject(args[paramIndex])) {
        if (ValidationUtil_1.default.isNotNull(prop)) {
            if (Reflect.has(args[paramIndex], prop)) {
                args[paramIndex][prop] = val;
            }
            else {
                Reflect.set(args[paramIndex], prop, val);
            }
        }
    }
}
function getErrMsg(rule, prop, msg) {
    let showMsg = msg;
    if (!showMsg) {
        showMsg = rule.message ? rule.message : `The ${prop ? prop : rule.paramIndex} parameter is invalid `;
    }
    let errorMsg = new ValidError(showMsg);
    return errorMsg;
}
//校验表单规则并且可以格式化数据类型
function ValidForm(rules) {
    //完善消息
    Object.keys(rules).forEach(prop => {
        let r = rules[prop];
        if (r.message) {
            r.nullMessage = r.nullMessage ? r.nullMessage : r.message;
            r.sizeMessgae = r.sizeMessgae ? r.sizeMessgae : r.message;
            r.typeMessage = r.typeMessage ? r.typeMessage : r.message;
        }
        else {
            r.nullMessage = `${prop} is required`;
            r.typeMessage = `${prop} type is ${r.type}`;
        }
    });
    return function (target, methodName, descriptor) {
        let targetFn = descriptor.value;
        descriptor.value = function (...args) {
            for (let prop in rules) {
                let rule = rules[prop];
                //进行取值
                let val = getFormValue(args, prop, rule.paramIndex, rule.defaultVal);
                //优先判断是否为必填项
                if (ValidationUtil_1.default.isNull(val)) {
                    if (rule.required) {
                        return getErrMsg(rule, prop, rule.nullMessage);
                    }
                    else {
                        delFormValue(args, prop, rule.paramIndex);
                    }
                }
                else {
                    //进行类型判断并赋值
                    val = DataFormat_1.default.formatValue(val, rule.type);
                    //调用check的方法
                    if (!ValidationUtil_1.default.checkType(val, rule.type)) {
                        return getErrMsg(rule, prop, rule.typeMessage);
                    }
                    //判断长度
                    if (rule?.minSize) {
                        if (!ValidationUtil_1.default.isNotMinSize(val, rule.minSize)) {
                            return getErrMsg(rule, prop, rule.sizeMessgae ? rule.sizeMessgae : `${prop} should be greater than ${rule.minSize} `);
                        }
                    }
                    if (rule?.maxSize) {
                        if (!ValidationUtil_1.default.isNotMaxSize(val, rule.maxSize)) {
                            return getErrMsg(rule, prop, rule.sizeMessgae ? rule.sizeMessgae : `${prop} should be less than ${rule.maxSize} `);
                        }
                    }
                    if (Array.isArray(rule.fns)) {
                        for (let fnItem of rule.fns) {
                            let fn = fnItem.fn;
                            let tmpArgs = [val];
                            if (fnItem?.args) {
                                tmpArgs = tmpArgs.concat(fnItem?.args);
                            }
                            let flag = Reflect.apply(fn, this, tmpArgs);
                            if (!flag) {
                                //抛出错误提示
                                return getErrMsg(rule, prop, fnItem.message);
                            }
                        }
                    }
                    //进行赋值
                    setFormValue(args, prop, rule.paramIndex, val);
                }
            }
            return Reflect.apply(targetFn, this, args);
        };
    };
}
exports.ValidForm = ValidForm;
