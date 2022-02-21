import type { Context, Middleware, Next } from "koa";
import * as fs from "fs";
import * as path from "path";
import { FastCarApplication } from "fastcar-core";
import { KoaConfig } from "../type/KoaConfig";
import * as koaStatic from "koa-static";
import * as KoaMount from "koa-mount";

const swaggerDefalutUrl = "https://petstore.swagger.io/v2/swagger.json";
//api显示和管理
export default function Swagger(app: FastCarApplication): Middleware[] {

	let mlist: Middleware[] = [];

	let koaConfig: KoaConfig = app.getSetting("koa");

	if (koaConfig.swagger && koaConfig.swagger.enable) {

		let apiMap = new Map<string, string>();
		let fileMap = new Map<string, string>()
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
		mlist.push(KoaMount("/swagger-ui", koaStatic(swaggerUiAssetPath)));

		const swaggerTemplate = fs.readFileSync(path.join(swaggerUiAssetPath, "index.html"), "utf-8");
		const fn = async (ctx: Context, next: Next) => {
			let url = ctx.url;
			let item = apiMap.get(url);
			if (!!item) {
				//输出路径
				ctx.type = "text/html";
				ctx.body = swaggerTemplate.replace(swaggerDefalutUrl, item).replace(/\.\//g, "./swagger-ui/");
				return;
			}

			let fp = fileMap.get(url);
			if(fp) {
               
				if(fs.existsSync(fp)) {

				   ctx.body = fs.readFileSync(fp,"utf-8")
				   return;
				}
			}

			await next();
		}
		mlist.unshift(fn);
	}

	return mlist;
}
