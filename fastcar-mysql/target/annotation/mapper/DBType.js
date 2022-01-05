"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../../type/DesignMeta");
//字段名称 如果没有则为统一
function DBType(name) {
    return function (target, propertyKey) {
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.dbType, name, target, propertyKey);
    };
}
exports.default = DBType;
