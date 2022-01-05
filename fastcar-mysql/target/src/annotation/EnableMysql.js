"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MysqlDataSourceManager_1 = require("../dataSource/MysqlDataSourceManager");
const fastcar_core_1 = require("fastcar-core");
//开启数据库功能
function EnableMysql(target) {
    //手动注入实例
    fastcar_core_1.FastCarApplication.setSpecifyCompent(MysqlDataSourceManager_1.default);
}
exports.default = EnableMysql;
