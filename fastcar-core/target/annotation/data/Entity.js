"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DesignMeta_1 = require("../../type/DesignMeta");
//这是一个模板类 代表具体的映射关系
function Entity(className) {
    return function (target) {
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.entity, className, target.prototype);
    };
}
exports.default = Entity;
