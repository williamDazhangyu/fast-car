"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const annotation_1 = require("fastcar-core/annotation");
//开启数据库功能
function EnableMongo(target) {
    //手动注入实例
    let fp = require.resolve("../dataSource/MongoDataSourceManager");
    annotation_1.ComponentInjection(target, fp);
}
exports.default = EnableMongo;
