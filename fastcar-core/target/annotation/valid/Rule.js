"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
require("reflect-metadata");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
const TypeUtil_1 = require("../../utils/TypeUtil");
function Rule(rules = {}) {
    return function (target, method, index) {
        //获取设计类型
        //获取增强类型的增加严格校验
        let paramsTypes = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.paramTypes, target, method);
        //对rules进行进一步的补充
        let designObj = paramsTypes[index];
        let basicFlag = false;
        if (!designObj) {
            console.warn(`Design type not found by ${method} in ${index}`);
        }
        else {
            basicFlag = TypeUtil_1.default.isBasic(designObj.name);
            //获取表单类型
            let childMap = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.ValidChildFormRules, target, `${method}-${index}`);
            //进行合并添加
            if (TypeUtil_1.default.isClass(designObj)) {
                let appendMap = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.ValidChildFormRules, designObj.prototype);
                if (appendMap) {
                    if (!childMap) {
                        childMap = new Map();
                    }
                    appendMap.forEach((v, key) => {
                        if (!childMap.has(key)) {
                            childMap.set(key, v);
                            return;
                        }
                        else {
                            //进行覆盖更新
                            let item = childMap.get(key);
                            if (Reflect.has(v, "filters")) {
                                if (Array.isArray(item?.filters)) {
                                    v.filters?.forEach(f => {
                                        item?.filters?.push(f);
                                    });
                                }
                            }
                            //合并所有属性
                            item = Object.assign(v, item);
                            childMap.set(key, item);
                        }
                    });
                }
            }
            if (childMap && childMap.size > 0) {
                //补充表单
                childMap.forEach((citem, prop) => {
                    if (Reflect.has(rules, prop)) {
                        //优先取表单里的
                        rules[prop] = Object.assign(citem, rules[prop]);
                    }
                    else {
                        Reflect.set(rules, prop, citem);
                    }
                });
            }
        }
        let rulesMap = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.ValidFormRules, target, method);
        if (!rulesMap) {
            rulesMap = new Map();
            Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.ValidFormRules, rulesMap, target, method);
        }
        //补全消息
        Object.keys(rules).forEach(prop => {
            let r = rules[prop];
            //根据增强型补全type
            if (basicFlag && !Reflect.has(r, "type")) {
                if (designObj) {
                    r.type = designObj.name.toLowerCase();
                }
                else {
                    r.type = "string";
                }
            }
            if (r.message) {
                if (r.required) {
                    r.nullMessage = r.nullMessage ? r.nullMessage : r.message;
                }
                if (r.maxSize || r.minSize) {
                    r.sizeMessgae = r.sizeMessgae ? r.sizeMessgae : r.message;
                }
                r.typeMessage = r.typeMessage ? r.typeMessage : r.message;
            }
            else {
                if (r.required) {
                    r.nullMessage = `${prop} is required`;
                }
                r.typeMessage = `${prop} type is ${r.type}`;
            }
        });
        rulesMap.set(index, { rules, basicFlag, index });
    };
}
exports.Rule = Rule;
