import { FormValidationUtil } from '../utils/FormValidationUtil';
import TypeUtil from '../utils/TypeUtil';
import DATAFORMAT from '../utils/DataFormat';
interface CommodModel {

    message?: string,
    prop?: string,
    defaultValue?: any
}

interface SizeModel extends CommodModel {

    min?: number,
    max?: number,
}


interface RuleModel extends CommodModel {
    index: number, //第几个参数
    fn: Function,
    args: any[],
}

type funModel = {

    fn: Function,
    message?: string,
    args?: any[], //自定义参数
}

//表单校验规则
interface FormRuleModel {

    message?: string, //错误信息
    type: string, // 类型
    minSize?: number, //最小值
    maxSize?: number, //最大值
    required?: boolean, //是否为必填项
    defaultVal?: any, //默认值
    fns?: funModel[], //校验方法
    paramIndex?: number, //位于第几个的参数校验
    nullMessage?: string, //是否为空的错误提示
    sizeMessgae?: string, //长度错误提示
    typeMessage?: string, //类型错误提示
}

class ValidError extends Error {


}

export function isValidError(err: any) {

    return err instanceof ValidError;
}

function getFunctionArgsName(fn: Function) {

    if (!TypeUtil.isFunction(fn)) {

        return [];
    }

    let str = fn.toString();
    let startIndex = str.indexOf("(");
    let endIndex = str.indexOf(")");

    let params = str.substring(startIndex + 1, endIndex);
    let paramList = params.split(",").map((item) => {

        let tmpIndex = item.indexOf("=");
        if (tmpIndex > -1) {

            item = item.substring(0, tmpIndex)
        }

        return item.trim();
    });
    return paramList;
}

//开启解析参数 将一个对象内的参数解析为多个参数
export function EnableParseMap(target: any, methodName: string, descriptor: PropertyDescriptor) {

    let targetFn = descriptor.value;
    let paramsMap = getFunctionArgsName(targetFn);

    descriptor.value = function (...args: any[]) {

        let newArgs: any[] = Array.of();
        for (let param of paramsMap) {

            let addValue = null;
            for (let arg of args) {

                if (TypeUtil.isObject(arg)) {

                    if (Reflect.has(arg, param)) {

                        addValue = arg[param];
                        break;
                    }
                }
            }

            newArgs.push(addValue);
        }

        return Reflect.apply(targetFn, this, newArgs);
    }
}

//是否开启规则校验
export function EnableForm(target: any, methodName: string, descriptor: PropertyDescriptor) {

    let targetFn = descriptor.value;
    let rules: RuleModel[] = Reflect.get(target[methodName], "formRules");

    descriptor.value = function (...args: any[]) {

        if (Array.isArray(rules)) {

            for (let rule of rules) {

                let value = args[rule.index];
                //查看是否校验子属性
                if (FormValidationUtil.isNotNull(value)) {

                    if (rule?.prop) {

                        if (Reflect.has(value, rule.prop)) {

                            value = value[rule.prop];
                        } else {

                            if (Reflect.has(rule, rule.defaultValue)) {

                                value = rule.defaultValue;
                            } else {

                                value = null;
                            }
                        }
                    }
                }

                //忽略空值
                if (FormValidationUtil.isNull(value) && rule.fn.name != "isNotNull") {

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

        return Reflect.apply(targetFn, this, args)
    }
}

function addRules(obj: any, rule: RuleModel) {

    if (!obj.formRules) {

        obj.formRules = Array.of();
    }

    obj.formRules.push(rule);
}

export function NotNull(m: CommodModel = {}) {

    return function (target: any, methodName: string, paramIndex: number) {

        addRules(target[methodName], {
            index: paramIndex,
            fn: FormValidationUtil.isNotNull,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue
        });
    }
}

export function Size({ min = 0, max = 0, message = "", prop, defaultValue }: SizeModel) {

    return function (target: any, methodName: string, paramIndex: number) {

        addRules(target[methodName], {
            index: paramIndex,
            fn: FormValidationUtil.isNotMaxSize,
            args: [max],
            message,
            prop,
            defaultValue
        });

        addRules(target[methodName], {
            index: paramIndex,
            fn: FormValidationUtil.isNotMinSize,
            args: [min],
            message,
            prop,
            defaultValue
        });
    }
}

export function IsNumber(m: CommodModel = {}) {

    return function (target: any, methodName: string, paramIndex: number) {

        addRules(target[methodName], {
            index: paramIndex,
            fn: FormValidationUtil.isNumber,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue
        });
    }
}

export function IsString(m: CommodModel = {}) {

    return function (target: any, methodName: string, paramIndex: number) {

        addRules(target[methodName], {
            index: paramIndex,
            fn: FormValidationUtil.isString,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue
        });
    }
}

export function IsBoolean(m: CommodModel = {}) {

    return function (target: any, methodName: string, paramIndex: number) {

        addRules(target[methodName], {
            index: paramIndex,
            fn: FormValidationUtil.isBoolean,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue
        });
    }
}

export function IsArray(m: CommodModel = {}, type: string = "string") {

    return function (target: any, methodName: string, paramIndex: number) {

        addRules(target[methodName], {
            index: paramIndex,
            fn: FormValidationUtil.isArray,
            args: [],
            message: m.message,
            prop: m.prop,
            defaultValue: m.defaultValue
        });
    }
}

function getFormValue(args: any[], prop: string, paramIndex: number = 0, defaultValue?: any) {

    let value = args[paramIndex];
    //查看是否校验子属性
    if (FormValidationUtil.isNotNull(value)) {

        if (FormValidationUtil.isNotNull(prop)) {

            if (Reflect.has(value, prop)) {

                return value[prop];
            }
        }
    }

    if (FormValidationUtil.isNotNull(defaultValue)) {

        return defaultValue;
    }

    return null;
}

function delFormValue(args: any[], prop: string, paramIndex: number = 0) {

    let value = args[paramIndex];
    //查看是否校验子属性
    if (FormValidationUtil.isNotNull(value)) {

        if (Reflect.has(value, prop)) {

            Reflect.deleteProperty(value, prop);
        }
    }
}

function setFormValue(args: any[], prop: string, paramIndex: number = 0, val: any) {

    //查看是否校验子属性
    if (FormValidationUtil.isNotNull(args[paramIndex]) || TypeUtil.isObject(args[paramIndex])) {

        if (FormValidationUtil.isNotNull(prop)) {

            if (Reflect.has(args[paramIndex], prop)) {

                args[paramIndex][prop] = val;
            } else {

                Reflect.set(args[paramIndex], prop, val)
            }
        }
    }
}

function getErrMsg(rule: FormRuleModel, prop: string, msg?: string) {

    let showMsg = msg;
    if (!showMsg) {

        showMsg = rule.message ? rule.message : `The ${prop ? prop : rule.paramIndex} parameter is invalid `;
    }
    let errorMsg = new ValidError(showMsg);
    return errorMsg;
}

//校验表单规则并且可以格式化数据类型
export function ValidForm(rules: { [prop: string]: FormRuleModel }) {

    //完善消息
    Object.keys(rules).forEach((prop) => {

        let r = rules[prop];
        if (r.message) {

            r.nullMessage = r.nullMessage ? r.nullMessage : r.message;
            r.sizeMessgae = r.sizeMessgae ? r.sizeMessgae : r.message;
            r.typeMessage = r.typeMessage ? r.typeMessage : r.message;
        } else {

            r.nullMessage = `${prop} is required`;
            r.typeMessage = `${prop} type is ${r.type}`;
        }
    });

    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {

        let targetFn = descriptor.value;

        descriptor.value = function (...args: any[]) {

            for (let prop in rules) {

                let rule = rules[prop];

                //进行取值
                let val = getFormValue(args, prop, rule.paramIndex, rule.defaultVal);

                //优先判断是否为必填项
                if (FormValidationUtil.isNull(val)) {

                    if (rule.required) {

                        return getErrMsg(rule, prop, rule.nullMessage);
                    } else {

                        delFormValue(args, prop, rule.paramIndex);
                    }
                } else {

                    //进行类型判断并赋值
                    val = DATAFORMAT.formatValue(val, rule.type);
                    //调用check的方法
                    if (!FormValidationUtil.checkType(val, rule.type)) {

                        return getErrMsg(rule, prop, rule.typeMessage);
                    }

                    //判断长度
                    if (rule?.minSize) {

                        if (!FormValidationUtil.isNotMinSize(val, rule.minSize)) {

                            return getErrMsg(rule, prop,
                                rule.sizeMessgae ? rule.sizeMessgae : `${prop} should be greater than ${rule.minSize} `);
                        }
                    }

                    if (rule?.maxSize) {

                        if (!FormValidationUtil.isNotMaxSize(val, rule.maxSize)) {

                            return getErrMsg(rule, prop,
                                rule.sizeMessgae ? rule.sizeMessgae : `${prop} should be less than ${rule.maxSize} `);
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
        }
    }
}