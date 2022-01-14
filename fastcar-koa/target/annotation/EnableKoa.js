"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastcar_core_1 = require("fastcar-core");
const KoaApplication_1 = require("../KoaApplication");
//开启koa应用
function EnableKoa(target) {
    fastcar_core_1.FastCarApplication.setSpecifyCompent(KoaApplication_1.default);
}
exports.default = EnableKoa;
