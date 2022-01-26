"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const annotation_1 = require("fastcar-core/annotation");
//开启redis插件
function EnableRedis(target) {
    let fp = require.resolve("../RedisDataSourceManager");
    annotation_1.ComponentInjection(target, fp);
}
exports.default = EnableRedis;
