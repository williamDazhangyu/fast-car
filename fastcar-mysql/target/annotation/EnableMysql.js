"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const annotation_1 = require("fastcar-core/annotation");
//开启数据库功能
function EnableMysql(target) {
    //手动注入实例
    let fp = require.resolve("../dataSource/MysqlDataSourceManager");
    annotation_1.ComponentInjection(target, fp);
}
exports.default = EnableMysql;
