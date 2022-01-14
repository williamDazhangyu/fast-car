"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const koaStatic = require("koa-static");
const KoaRange = require("koa-range");
const fs = require("fs");
const path = require("path");
//支持静态文件访问
function KoaStatic(app) {
    let mlist = [];
    //采用koa-range使文件可以流式传播
    mlist.push(KoaRange);
    let koaConfig = app.getSetting("koa");
    if (Array.isArray(koaConfig?.koaStatic)) {
        for (let fp of koaConfig.koaStatic) {
            let rp = path.join(app.getResourcePath(), fp);
            if (!fs.existsSync(fp)) {
                if (!fs.existsSync(rp)) {
                    console.error(`${fp} is not found`);
                    continue;
                }
                else {
                    fp = rp;
                }
            }
            mlist.push(koaStatic(fp));
        }
    }
    return mlist;
}
exports.default = KoaStatic;
