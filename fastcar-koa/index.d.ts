import { FastCarApplication, Logger } from "@fastcar/core";
import * as Koa from "koa";
import * as koaBody from "koa-body";
import * as bodyParser from "koa-bodyparser";
import { ServerConfig } from "@fastcar/server";

type MiddleWareType = (...args: any) => Koa.Middleware | Koa.Middleware[];

export class KoaApplication {
	protected app: FastCarApplication;
	protected sysLogger: Logger;
	protected koaApp: Koa;

	/***
	 * @version 1.0 加载中间件
	 *
	 */
	protected loadMiddleWare(list: Koa.Middleware | Koa.Middleware[]): void;

	/***
	 * @version 1.0 加载路由
	 *
	 */
	protected loadRoute(): Koa.Middleware;

	/***
	 * @version 1.0 应用启动时加载应用 加载顺序为中间件->路由->开启服务
	 */
	start(): void;

	/***
	 * @version 1.0 应用停止时加载 依次关闭http服务器
	 */
	stop(): void;
}

export type KoaConfig = {
	server: ServerConfig[] | ServerConfig; //监听的端口号
	koaStatic?: string[]; //相对路径为resource下的 或者绝对文件路径
	koaBodyOptions?: koaBody.IKoaBodyOptions; //文件上传的解析
	koaBodyParser?: bodyParser.Options; //解析请求
	extra?: { [key: string]: any }; //拓展设置
};

//全局异常捕捉 可以用自定义的替换这个函数
export function ExceptionGlobalHandler(app: FastCarApplication): MiddleWareType;

//解析body参数
export function KoaBody(app: FastCarApplication): MiddleWareType;

//解析Body参数 这个更好用
export function KoaBodyParser(app: FastCarApplication): MiddleWareType;

//支持跨域
export function KoaCors(app: FastCarApplication): MiddleWareType;

//解析静态文件
export function KoaStatic(app: FastCarApplication): MiddleWareType;

//支持api说明
export function Swagger(app: FastCarApplication): MiddleWareType;

//增强multi文件解析
export function KoaMulter(app: FastCarApplication): MiddleWareType;

export * from "./src/type/DesignMeta";
