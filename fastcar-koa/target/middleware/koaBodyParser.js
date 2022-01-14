"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("koa-bodyparser");
//对文件内容做解析
function KoaBodyParser(app) {
    let koaConfig = app.getSetting("koa");
    let bodyConfig = koaConfig?.koaBodyParser;
    return bodyParser(bodyConfig);
}
exports.default = KoaBodyParser;
