"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const koaStatic = require("koa-static");
const swaggerDefalutUrl = "https://petstore.swagger.io/v2/swagger.json";
//api显示和管理
function Swagger(app) {
    let mlist = [];
    let koaConfig = app.getSetting("koa");
    if (koaConfig.swagger && koaConfig.swagger.enable) {
        let apiMap = new Map();
        let fileMap = new Map();
        let apis = koaConfig.swagger.api;
        if (apis) {
            Object.keys(apis).forEach((key) => {
                let value = apis[key];
                if (!key.startsWith("/")) {
                    key = `/${key}`;
                }
                let realValue = value.startsWith("/") ? value : "/" + value;
                apiMap.set(key, realValue);
                fileMap.set(realValue, path.join(app.getResourcePath(), value));
            });
        }
        //进行设置静态访问路径
        const swaggerUiAssetPath = require("swagger-ui-dist").getAbsoluteFSPath();
        mlist.push(koaStatic(swaggerUiAssetPath));
        const swaggerTemplate = fs.readFileSync(path.join(swaggerUiAssetPath, "index.html"), "utf-8");
        const fn = async (ctx, next) => {
            let url = ctx.url;
            let item = apiMap.get(url);
            if (!!item) {
                //输出路径
                ctx.type = "text/html";
                ctx.body = swaggerTemplate.replace(swaggerDefalutUrl, item);
                return;
            }
            let fp = fileMap.get(url);
            if (fp) {
                if (fs.existsSync(fp)) {
                    ctx.body = fs.readFileSync(fp, "utf-8");
                    return;
                }
            }
            await next();
        };
        mlist.push(fn);
    }
    return mlist;
}
exports.default = Swagger;
