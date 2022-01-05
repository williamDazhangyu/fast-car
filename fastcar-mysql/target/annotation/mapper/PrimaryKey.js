"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../../type/DesignMeta");
//是否为主键
function PrimaryKey(target, propertyKey) {
    Reflect.defineMetadata(DesignMeta_1.DesignMeta.primaryKey, true, target, propertyKey);
}
exports.default = PrimaryKey;
