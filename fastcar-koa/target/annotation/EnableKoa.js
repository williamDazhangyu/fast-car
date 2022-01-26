"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const annotation_1 = require("fastcar-core/annotation");
//开启koa应用
function EnableKoa(target) {
    let fp = require.resolve("../KoaApplication");
    annotation_1.ComponentInjection(target, fp);
}
exports.default = EnableKoa;
