"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastcar_core_1 = require("fastcar-core");
const RedisDataSourceManager_1 = require("../RedisDataSourceManager");
//开启redis插件
function EnableRedis(target) {
    fastcar_core_1.FastCarApplication.setSpecifyCompent(RedisDataSourceManager_1.default);
}
exports.default = EnableRedis;
