"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
const TypeUtil_1 = require("../../utils/TypeUtil");
//添加子元素的校验规则
function AddChildValid(target, name, value) {
    let childMap = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.ValidChildFormRules, target);
    if (!childMap) {
        childMap = new Map();
    }
    let item = childMap.get(name);
    if (!item) {
        let proto = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.designType, target, name);
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
            value["filters"] = [...item.filters, ...value.filters];
        }
    }
    //合并所有属性
    Object.assign(item, value);
    childMap.set(name, item);
}
exports.default = AddChildValid;
