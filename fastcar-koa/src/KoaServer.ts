import FastCarApplication from "../../core/src/service/FastCarApplication";
import * as Koa from "koa";
import * as KoaRouter from "koa-router";
import * as bodyParser from "koa-bodyparser";
import { HANDLER_SERVICE, ROUTER_MAP } from "../../core/src/common/ConstantFile";
import { MethodInfo, UrlName } from "../../core/src/decorators/Router";
import * as KoaUtil from "./KoaUtil";
import { KoaExceptionHandlerService, KoaResultHandlerServiceImpl } from "../../core/src/interface/impl/HandlerServiceImpl";
import { Override } from "../../core/src/decorators/Common";

//koahttp服务类
class KoaServer extends FastCarApplication {
	static middlewareList: Function[] = Array.of();
	static staticConfig: KoaUtil.KoaStaticConfig[] = Array.of();

	//读取配置
	constructor() {
		super();
	}

	//加载默认的包装服务
	@Override
	loadDefaultHandlerService() {
		this.setHandlerService(HANDLER_SERVICE.ExceptionHandlerService, new KoaExceptionHandlerService());

		this.setHandlerService(HANDLER_SERVICE.ResultHandlerService, new KoaResultHandlerServiceImpl());
	}

	@Override
	async loadRoute() {
		const router = new KoaRouter();

		let instanceList = this.getControllerInstance();

		//查找绑定的url
		instanceList.forEach(instance => {
			if (Reflect.has(instance, ROUTER_MAP)) {
				let routerMap: Map<UrlName, MethodInfo> = instance[ROUTER_MAP];
				routerMap.forEach(item => {
					let func = instance[item.methodName];
					if (func) {
						for (let method of item.methods) {
							//去除ctx的影响
							let callBack = async (ctx: any, next: Function) => {
								//进行参数的取值
								let body = Object.keys(ctx.query).length > 0 ? ctx.query : ctx.request.body;

								if (!!ctx.params) {
									Object.assign(body, ctx.params);
								}

								let res = await instance[item.methodName](body, ctx);
								if (!!res) {
									ctx.body = res;
								}
							};

							//进行绑定
							Reflect.apply(router[`${method}`], router, [item.urlName, callBack]);
						}
					}
				});
			}
		});

		this.routes = router.routes();
	}

	@Override
	async startServer() {
		const app = new Koa();

		let koaStaticRes = this.getSetting("koaStaticConfig");
		if (!!koaStaticRes) {
			KoaServer.staticConfig = [...koaStaticRes, ...KoaServer.staticConfig];
		}

		KoaUtil.koaStaticInit(app, KoaServer.staticConfig);

		app.use(bodyParser()); //解析中间件

		//补充多媒体中间件
		let koaBodyConfig = this.getSetting("koaBodyConfig");
		if (!!koaBodyConfig) {
			KoaUtil.koaBodyInit(app, koaBodyConfig);
		}

		//启用封装错误方法
		const exceptionHandler = this.getHandlerService(HANDLER_SERVICE.ExceptionHandlerService);
		app.use(exceptionHandler.handler);

		//返回方法包装
		const resultHandler = this.getHandlerService(HANDLER_SERVICE.ResultHandlerService);
		app.use(resultHandler.handler);

		//启用自定义的中间件
		let middlewareList = KoaServer.middlewareList;
		for (let m of middlewareList) {
			app.use(m());
		}

		//挂载路由
		app.use(this.routes);

		let { port, name } = this.sysConfig.application;
		app.listen(port, () => {
			console.info(`server ${name} is running in ${port}`);
		});

		//注册监听事件
		app.on("error", err => {
			console.error("message", err);
		});

		//上下文绑定服务本身
		app.context.serverService = this;
		this.containerServer.set("KoaHttp", app);
	}

	static setMiddleware(fn: Function) {
		KoaServer.middlewareList.unshift(() => {
			return fn;
		});
	}
}

export default KoaServer;
