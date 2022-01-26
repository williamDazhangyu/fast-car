"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FastCarMetaData_1 = require("../constant/FastCarMetaData");
const Format_1 = require("../utils/Format");
const AddRequireModule_1 = require("./AddRequireModule");
const SpecWords = ["Boolean", "Number", "String", "Object"];
/***
 * @version 1.0 说明哪些模块需要被加载
 *
 *
 */
function Autowired(target, propertyKey) {
    //反向找设计类型
    const designType = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.designType, target, propertyKey);
    let key = "";
    let name = "";
    if (designType) {
        name = designType.name;
        key = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.InjectionUniqueKey, designType); //放入至原型中
    }
    //获取不到注入的值时默认为别名的值
    if (!name || SpecWords.includes(name)) {
        key = Format_1.default.formatFirstToUp(propertyKey);
    }
    AddRequireModule_1.default(target, propertyKey, key);
}
exports.default = Autowired;
