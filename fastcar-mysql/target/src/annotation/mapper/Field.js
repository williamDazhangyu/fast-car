"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../../type/DesignMeta");
//数据库列名称
function Field(name) {
    return function (target, propertyKey) {
        let fieldMap = Reflect.getMetadata(DesignMeta_1.DesignMeta.fieldMap, target);
        if (!fieldMap) {
            Reflect.defineMetadata(DesignMeta_1.DesignMeta.fieldMap, new Set([propertyKey]), target);
        }
        else {
            fieldMap.add(propertyKey);
        }
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.field, name, target, propertyKey);
    };
}
exports.default = Field;
