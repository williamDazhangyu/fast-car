"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
const TypeUtil_1 = require("../../utils/TypeUtil");
const ValidationUtil_1 = require("../../utils/ValidationUtil");
//添加子元素的校验规则
function AddChildValid(target, name, value, index) {
    let childMap;
    let alias = `${name}-${index}`;
    let paramsFlag = ValidationUtil_1.default.isNumber(index);
    if (paramsFlag) {
        childMap = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.ValidChildFormRules, target, alias);
        if (!childMap) {
            childMap = new Map();
            Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.ValidChildFormRules, childMap, target, alias);
        }
    }
    else {
        childMap = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.ValidChildFormRules, target);
        if (!childMap) {
            childMap = new Map();
            Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.ValidChildFormRules, childMap, target);
        }
    }
    let item = childMap.get(alias);
    if (!item) {
        let proto = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.designType, target, name);
        if (paramsFlag) {
            //修改为方法获取原型
            let paramsTypes = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.paramTypes, target, name);
            if (typeof index == "number") {
                proto = paramsTypes[index];
            }
        }
        let typeName = proto.name.toLowerCase();
        if (!TypeUtil_1.default.isBasic(typeName)) {
            typeName = typeName == "array" ? "array" : "object";
        }
        item = {
            type: typeName,
        };
    }
    //自定义方法合并
    if (Reflect.has(value, "filters")) {
        if (Array.isArray(item.filters)) {
            item.filters.forEach(f => {
                value.filters.push(f);
            });
        }
    }
    //合并所有属性
    Object.assign(item, value);
    childMap.set(alias, item);
}
exports.default = AddChildValid;
