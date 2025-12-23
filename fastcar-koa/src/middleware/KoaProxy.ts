import { FastCarApplication } from "@fastcar/core";
import * as Koa from "koa";
import { KoaConfig } from "../type/KoaConfig";

//反向代理扩展
export default function KoaProxy(app: FastCarApplication): Koa.Middleware {
	const httpProxy = require("http-proxy-middleware");
	const k2c = require("koa2-connect");
	const { match } = require("path-to-regexp");

	return async function (ctx, next) {
		let koaConfig: KoaConfig = app.getSetting("koa");

		if (koaConfig && koaConfig.koaProxy) {
			const { path } = ctx;
			for (const route of Object.keys(koaConfig.koaProxy)) {
				if (
					match(route, {
						decode: decodeURIComponent,
					})(path)
				) {
					return await k2c(httpProxy.createProxyMiddleware(koaConfig.koaProxy[route]))(ctx, next);
				}
			}
		}

		await next();
	};
}
