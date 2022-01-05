"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const DesignMeta_1 = require("../type/DesignMeta");
function SqlSession(target, name, index) {
    Reflect.defineMetadata(DesignMeta_1.DesignMeta.sqlSession, index, target, name);
}
exports.default = SqlSession;
