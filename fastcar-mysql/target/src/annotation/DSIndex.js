"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../type/DesignMeta");
//用于标记数据源位置
function DSIndex(target, name, index) {
    Reflect.defineMetadata(DesignMeta_1.DesignMeta.dsIndex, index, target, name);
}
exports.default = DSIndex;
