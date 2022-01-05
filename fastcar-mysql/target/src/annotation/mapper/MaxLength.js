"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DesignMeta_1 = require("../../type/DesignMeta");
//限制的最大长度
function MaxLength(length) {
    return function (target, propertyKey) {
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.maxLength, length, target, propertyKey);
    };
}
exports.default = MaxLength;
