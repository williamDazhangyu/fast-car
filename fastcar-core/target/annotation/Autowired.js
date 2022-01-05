"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    const designType = Reflect.getMetadata("design:type", target, propertyKey);
    let name = "";
    if (designType) {
        name = designType.name;
    }
    if (!name || SpecWords.includes(name)) {
        name = Format_1.default.formatFirstToUp(propertyKey);
    }
    AddRequireModule_1.default(target, propertyKey, name);
}
exports.default = Autowired;
