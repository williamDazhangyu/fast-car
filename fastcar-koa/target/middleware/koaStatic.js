"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const koaStatic = require("koa-static");
const KoaRange = require("koa-range");
const KoaMount = require("koa-mount");
const fs = require("fs");
const path = require("path");
//支持静态文件访问
function KoaStatic(app) {
    let mlist = [];
    //采用koa-range使文件可以流式传播
    mlist.push(KoaRange);
    let koaConfig = app.getSetting("koa");
    if (!!koaConfig?.koaStatic) {
        let keys = Object.keys(koaConfig?.koaStatic);
        if (keys.length > 0) {
            for (let key of keys) {
                let fp = koaConfig.koaStatic[key];
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
                if (!key.startsWith("/")) {
                    key = `/${key}`;
                }
                mlist.push(KoaMount(key, koaStatic(fp)));
            }
        }
    }
    return mlist;
}
exports.default = KoaStatic;
