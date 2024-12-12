import "reflect-metadata";
import { ApplicationStart, ApplicationStop, Autowired, Log } from "@fastcar/core/annotation";
import { FastCarApplication, BootPriority, ComponentKind, Logger } from "@fastcar/core";
import * as Koa from "koa";
import * as KoaRouter from "@koa/router";
import { MethodType } from "./type/MethodType";
import { DesignMeta } from "./type/DesignMeta";
import { TypeUtil, ValidationUtil } from "@fastcar/core/utils";
import { KoaConfig } from "./type/KoaConfig";
import { ServerApplication } from "@fastcar/server";

/***
 * @version 1.0 koa基础组件启动
 *
 */
@ApplicationStart(BootPriority.Lowest, "start")
@ApplicationStop(BootPriority.Base, "stop")
export default class KoaApplication {
	@Autowired
	protected app!: FastCarApplication;

	@Log("koa")
	protected koaLogger!: Logger;

	protected koaApp: Koa;

	@Autowired
	private serverApplication!: ServerApplication;

	constructor() {
		this.koaApp = new Koa();
	}

	/***
	 * @version 1.0 加载中间件
	 *
	 */
	protected loadMiddleWare(list: Koa.Middleware | Koa.Middleware[]): void {
		if (Array.isArray(list)) {
			list.forEach((item) => {
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
		let router = new KoaRouter();

		let instanceList = this.app.getComponentByType(ComponentKind.Controller);

		//查找绑定的url
		instanceList.forEach((instance) => {
			let routerMap: Map<string, MethodType> = Reflect.getMetadata(DesignMeta.ROUTER_MAP, instance);
			//移除空的map结构
			if (!routerMap || routerMap.size == 0) {
				return;
			}
			routerMap.forEach((item) => {
				//去除ctx的影响
				let callBack = async (ctx: any, next?: Function) => {
					//进行参数的取值
					let body = {};

					//自动合并传参 如果有重合的部分 需要再次单独取就好了
					if (Object.keys(ctx.query).length > 0) {
						Object.assign(body, ctx.query);
					}

					if (!!ctx.request.body) {
						Object.assign(body, ctx.request.body);
					}

					if (!!ctx.params) {
						Object.assign(body, ctx.params);
					}

					let res = await instance[item.method](body, ctx);
					if (ValidationUtil.isNotNull(res)) {
						ctx.body = res;
					}

					if (next) {
						await next();
					}
				};

				for (let r of item.request) {
					//进行绑定 加载router路由的执行方法
					Reflect.apply(router[`${r}`], router, [item.url, callBack]);
				}
			});
		});

		return router.routes() as any;
	}

	start(): void {
		const koaApp = this.koaApp;

		//加载中间件
		let middlewareList: Function[] = this.app.getSetting(DesignMeta.KoaMIDDLEWARE);
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
				koaConfig.server.forEach((server) => {
					this.serverApplication.createServer(server, appCallback);
				});
			} else {
				this.serverApplication.createServer(koaConfig.server, appCallback);
			}
		}
	}

	async stop(): Promise<void> {}
}
