"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const annotation_1 = require("fastcar-core/annotation");
const fastcar_core_1 = require("fastcar-core");
const Koa = require("koa");
const KoaRouter = require("koa-router");
const DesignMeta_1 = require("./type/DesignMeta");
const KoaConfig_1 = require("./type/KoaConfig");
const http = require("http");
const https = require("https");
const http2 = require("http2");
const utils_1 = require("fastcar-core/utils");
/***
 * @version 1.0 koa基础组件启动
 *
 */
let KoaApplication = class KoaApplication {
    constructor() {
        this.serverList = Array.of();
        this.koaApp = new Koa();
    }
    /***
     * @version 1.0 加载中间件
     *
     */
    loadMiddleWare(list) {
        if (Array.isArray(list)) {
            list.forEach(item => {
                if (utils_1.TypeUtil.isFunction(item)) {
                    this.koaApp.use(item);
                }
            });
        }
        else {
            if (utils_1.TypeUtil.isFunction(list)) {
                this.koaApp.use(list);
            }
        }
    }
    /***
     * @version 1.0 加载路由
     *
     */
    loadRoute() {
        let router = new KoaRouter();
        let instanceList = this.app.getComponentByType(fastcar_core_1.ComponentKind.Controller);
        //查找绑定的url
        instanceList.forEach(instance => {
            let routerMap = Reflect.getMetadata(DesignMeta_1.DesignMeta.ROUTER_MAP, instance);
            routerMap.forEach(item => {
                //去除ctx的影响
                let callBack = async (ctx, next) => {
                    //进行参数的取值
                    let body = Object.keys(ctx.query).length > 0 ? ctx.query : ctx.request.body;
                    if (!body) {
                        body = {};
                    }
                    if (!!ctx.params) {
                        Object.assign(body, ctx.params);
                    }
                    let res = await instance[item.method](body, ctx);
                    if (!!res) {
                        ctx.body = res;
                    }
                    if (next) {
                        next();
                    }
                };
                for (let r of item.request) {
                    //进行绑定 加载router路由的执行方法
                    Reflect.apply(router[`${r}`], router, [item.url, callBack]);
                }
            });
        });
        return router.routes();
    }
    /***
     * @version 1.0 创建服务器
     *
     */
    createServer(config, appCallBack) {
        if (!config.protocol) {
            config.protocol = KoaConfig_1.HttpProtocol.http;
        }
        if (!config.port) {
            config.port = config.protocol ? 80 : 443;
        }
        let appName = this.app.getApplicationName();
        let server;
        switch (config.protocol) {
            case KoaConfig_1.HttpProtocol.http: {
                server = http.createServer(appCallBack);
                break;
            }
            case KoaConfig_1.HttpProtocol.https: {
                if (!config.ssl) {
                    this.sysLogger.error(`https requires ssl config`);
                    process.exit();
                }
                server = https.createServer({
                    key: this.app.getFileContent(config.ssl?.key),
                    cert: this.app.getFileContent(config.ssl?.cert),
                }, appCallBack);
                break;
            }
            case KoaConfig_1.HttpProtocol.http2: {
                if (!config.ssl) {
                    server = http2.createServer();
                }
                else {
                    server = http2.createSecureServer({
                        key: this.app.getFileContent(config.ssl?.key),
                        cert: this.app.getFileContent(config.ssl?.cert),
                    }, appCallBack);
                }
                break;
            }
            default: {
                return;
            }
        }
        let listentCallBack = () => {
            this.sysLogger.info(`server ${appName} is running in ${config.port}`);
        };
        if (!!config.hostname) {
            server.listen(config.port, config.hostname, listentCallBack);
        }
        else {
            server.listen(config.port, listentCallBack);
        }
        this.serverList.push(server);
    }
    start() {
        const koaApp = this.koaApp;
        //加载中间件
        let middlewareList = Reflect.getMetadata(DesignMeta_1.DesignMeta.KoaMIDDLEWARE, this.app);
        if (Array.isArray(middlewareList)) {
            for (let m of middlewareList) {
                if (utils_1.TypeUtil.isPromise(m)) {
                    Reflect.apply(m, this, [this.app, koaApp]).then((tmpList) => {
                        this.loadMiddleWare(tmpList);
                    });
                }
                else {
                    let tmpList = Reflect.apply(m, this, [this.app, koaApp]);
                    this.loadMiddleWare(tmpList);
                }
            }
        }
        //加载路由
        koaApp.use(this.loadRoute());
        //读取配置文件 创建服务器
        let appCallback = koaApp.callback();
        let koaConfig = this.app.getSetting("koa");
        if (!!koaConfig.server) {
            if (Array.isArray(koaConfig.server)) {
                koaConfig.server.forEach(server => {
                    this.createServer(server, appCallback);
                });
            }
            else {
                this.createServer(koaConfig.server, appCallback);
            }
        }
    }
    stop() {
        this.serverList.forEach(server => {
            server.close();
        });
        this.sysLogger.info("koa server close");
    }
};
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", fastcar_core_1.FastCarApplication)
], KoaApplication.prototype, "app", void 0);
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", fastcar_core_1.Logger)
], KoaApplication.prototype, "sysLogger", void 0);
KoaApplication = __decorate([
    annotation_1.ApplicationStart(fastcar_core_1.BootPriority.Lowest, "start"),
    annotation_1.ApplicationStop(fastcar_core_1.BootPriority.Base, "start"),
    __metadata("design:paramtypes", [])
], KoaApplication);
exports.default = KoaApplication;
