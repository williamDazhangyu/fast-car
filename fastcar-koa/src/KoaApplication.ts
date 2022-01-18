import "reflect-metadata";
import { ApplicationStart, ApplicationStop, Autowired } from "fastcar-core/annotation";
import { FastCarApplication, BootPriority, ComponentKind, Logger } from "fastcar-core";
import * as Koa from "koa";
import * as KoaRouter from "koa-router";
import { MethodType } from "./type/MethodType";
import { DesignMeta } from "./type/DesignMeta";
import { HttpProtocol, KoaConfig, ServerConfig } from "./type/KoaConfig";
import * as http from "http";
import * as https from "https";
import * as http2 from "http2";
import { TypeUtil } from "fastcar-core/utils";

/***
 * @version 1.0 koa基础组件启动
 *
 */
@ApplicationStart(BootPriority.Lowest, "start")
@ApplicationStop(BootPriority.Base, "start")
export default class KoaApplication {
	@Autowired
	protected app!: FastCarApplication;

	@Autowired
	protected sysLogger!: Logger;

	protected serverList: (http.Server | https.Server | http2.Http2SecureServer | http2.Http2Server)[];

	protected koaApp: Koa;

	constructor() {
		this.serverList = Array.of();
		this.koaApp = new Koa();
	}

	/***
	 * @version 1.0 加载中间件
	 *
	 */
	protected loadMiddleWare(list: Koa.Middleware | Koa.Middleware[]): void {
		if (Array.isArray(list)) {
			list.forEach(item => {
				if (TypeUtil.isFunction(item)) {
					this.koaApp.use(item);
				}
			});
		} else {
			if (TypeUtil.isFunction(list)) {
				this.koaApp.use(list);
			}
		}
	}

	/***
	 * @version 1.0 加载路由
	 *
	 */
	protected loadRoute(): Koa.Middleware {
		let router: any = new KoaRouter();

		let instanceList = this.app.getComponentByType(ComponentKind.Controller);

		//查找绑定的url
		instanceList.forEach(instance => {
			let routerMap: Map<string, MethodType> = Reflect.getMetadata(DesignMeta.ROUTER_MAP, instance);
			routerMap.forEach(item => {
				//去除ctx的影响
				let callBack = async (ctx: any, next?: Function) => {
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
	createServer(config: ServerConfig, appCallBack: any): void {
		if (!config.protocol) {
			config.protocol = HttpProtocol.http;
		}

		if (!config.port) {
			config.port = config.protocol ? 80 : 443;
		}

		let appName = this.app.getApplicationName();
		let server: http.Server | https.Server | http2.Http2SecureServer | http2.Http2Server;

		switch (config.protocol) {
			case HttpProtocol.http: {
				server = http.createServer(appCallBack);
				break;
			}
			case HttpProtocol.https: {
				if (!config.ssl) {
					this.sysLogger.error(`https requires ssl config`);
					process.exit();
				}
				server = https.createServer(
					{
						key: this.app.getFileContent(config.ssl?.key),
						cert: this.app.getFileContent(config.ssl?.cert),
					},
					appCallBack
				);
				break;
			}
			case HttpProtocol.http2: {
				if (!config.ssl) {
					server = http2.createServer();
				} else {
					server = http2.createSecureServer(
						{
							key: this.app.getFileContent(config.ssl?.key),
							cert: this.app.getFileContent(config.ssl?.cert),
						},
						appCallBack
					);
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
		} else {
			server.listen(config.port, listentCallBack);
		}

		this.serverList.push(server);
	}

	start(): void {
		const koaApp = this.koaApp;

		//加载中间件
		let middlewareList: Function[] = Reflect.getMetadata(DesignMeta.KoaMIDDLEWARE, this.app);
		if (Array.isArray(middlewareList)) {
			for (let m of middlewareList) {
				if (TypeUtil.isPromise(m)) {
					Reflect.apply(m, this, [this.app, koaApp]).then((tmpList: Koa.Middleware | Koa.Middleware[]) => {
						this.loadMiddleWare(tmpList);
					});
				} else {
					let tmpList: Koa.Middleware | Koa.Middleware[] = Reflect.apply(m, this, [this.app, koaApp]);
					this.loadMiddleWare(tmpList);
				}
			}
		}

		//加载路由
		koaApp.use(this.loadRoute());

		//读取配置文件 创建服务器
		let appCallback = koaApp.callback();
		let koaConfig: KoaConfig = this.app.getSetting("koa");

		if (!!koaConfig.server) {
			if (Array.isArray(koaConfig.server)) {
				koaConfig.server.forEach(server => {
					this.createServer(server, appCallback);
				});
			} else {
				this.createServer(koaConfig.server, appCallback);
			}
		}
	}

	stop(): void {
		this.serverList.forEach(server => {
			server.close();
		});

		this.sysLogger.info("koa server close");
	}
}
