import { FastCarApplication } from "@fastcar/core";
import { KoaConfig } from "../type/KoaConfig";
import { Context } from "koa";

export default function KoaCors(app: FastCarApplication) {
	const koa2Cors = require("koa2-cors");

	let koaConfig: KoaConfig = app.getSetting("koa");
	if (koaConfig?.extra) {
		let corsConfig = Reflect.get(koaConfig.extra, "cors");
		if (!!corsConfig) {
			//兼容支持多个跨域
			if (typeof corsConfig.origin == "string") {
				let origins = corsConfig.origin.split(";");
				Reflect.set(corsConfig, "origin", (ctx: Context): boolean | string => {
					let orign = ctx?.request?.header?.origin;
					if (!orign) {
						if (!origins.includes("*")) {
							return false;
						}

						return "*";
					}

					for (let o of origins) {
						if (orign.startsWith(o) || o == "*") {
							return orign;
						}
					}

					return false;
				});
			}

			if (corsConfig.allowMethods == "*" || corsConfig.allowHeaders == "*") {
				return async (ctx: Context, next: () => Promise<any>) => {
					let requestCorsConfig = { ...corsConfig };
					if (corsConfig.allowMethods == "*") {
						let method = ctx.get("Access-Control-Request-Method");
						requestCorsConfig.allowMethods = method ? [method] : undefined;
					}
					if (corsConfig.allowHeaders == "*") {
						let headers = ctx.get("Access-Control-Request-Headers");
						requestCorsConfig.allowHeaders = headers ? [headers] : undefined;
					}
					return koa2Cors(requestCorsConfig)(ctx, next);
				};
			}
		}
		return koa2Cors(corsConfig);
	}

	return [];
}
