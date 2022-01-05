"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DesignMeta_1 = require("../../type/DesignMeta");
//是否为非空字段
function NotNull(target, propertyKey) {
    Reflect.defineMetadata(DesignMeta_1.DesignMeta.notNull, true, target, propertyKey);
}
exports.default = NotNull;
