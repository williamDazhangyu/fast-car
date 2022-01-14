import { FastCarApplication, Logger } from "fastcar-core";
import * as Koa from "koa";
import * as http from "http";
import * as https from "https";
import * as http2 from "http2";
import { ServerConfig } from "./src/type/KoaConfig";

export class KoaApplication {
	protected app: FastCarApplication;
	protected sysLogger: Logger;
	protected serverList: (http.Server | https.Server | http2.Http2SecureServer | http2.Http2Server)[];
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
	 * @version 1.0 创建服务器
	 */
	createServer(config: ServerConfig, appCallBack: any): void;

	/***
	 * @version 1.0 应用启动时加载应用 加载顺序为中间件->路由->开启服务
	 */
	start(): void;

	/***
	 * @version 1.0 应用停止时加载 依次关闭http服务器
	 */
	stop(): void;
}
