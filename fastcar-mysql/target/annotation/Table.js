"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../type/DesignMeta");
const fastcar_core_1 = require("fastcar-core");
//表名称 不缺省
function Table(name) {
    return function (target) {
        const proto = target.prototype;
        let fields = Reflect.getOwnMetadata(DesignMeta_1.DesignMeta.fieldMap, proto);
        let mappingMap = new Map();
        let dbFields = new Map();
        fields.forEach((c) => {
            let tsType = Reflect.getOwnMetadata(fastcar_core_1.FastCarMetaData.designType, proto, c);
            let field = Reflect.getOwnMetadata(DesignMeta_1.DesignMeta.field, proto, c) || c;
            let dbType = Reflect.getOwnMetadata(DesignMeta_1.DesignMeta.dbType, proto, c) || "varchar";
            let primaryKey = !!Reflect.getOwnMetadata(DesignMeta_1.DesignMeta.primaryKey, proto, c);
            let tsName = tsType.name;
            const m = {
                name: c,
                type: tsName.toLowerCase(),
                field,
                dbType: dbType,
                primaryKey, //是否为主键 默认为false
            };
            dbFields.set(field, c);
            mappingMap.set(c, m);
        });
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.dbFields, dbFields, target); //作用的列名
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.mapping, mappingMap, target); //映射关系
        Reflect.defineMetadata(DesignMeta_1.DesignMeta.table, name, target); //注入表名
    };
}
exports.default = Table;
