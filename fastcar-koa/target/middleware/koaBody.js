"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const koaBody = require("koa-body");
//对于文件上传做限定
function KoaBody(app) {
    let koaConfig = app.getSetting("koa");
    let bodyConfig = koaConfig?.koaBodyOptions;
    return koaBody(bodyConfig);
}
exports.default = KoaBody;
