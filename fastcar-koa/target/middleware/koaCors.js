"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const koa2Cors = require("koa2-cors");
function KoaCors(app) {
    let koaConfig = app.getSetting("koa");
    if (koaConfig?.extra) {
        let corsConfig = Reflect.get(koaConfig.extra, "cors");
        return koa2Cors(corsConfig);
    }
    return [];
}
exports.default = KoaCors;
