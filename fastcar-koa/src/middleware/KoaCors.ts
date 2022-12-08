import { FastCarApplication } from "@fastcar/core";
import * as koa2Cors from "koa2-cors";
import { KoaConfig } from "../type/KoaConfig";
import { Context } from "koa";

export default function KoaCors(app: FastCarApplication) {
	let koaConfig: KoaConfig = app.getSetting("koa");
	if (koaConfig?.extra) {
		let corsConfig: koa2Cors.Options = Reflect.get(koaConfig.extra, "cors");
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
							return o;
						}
					}

					return false;
				});
			}
		}
		return koa2Cors(corsConfig);
	}

	return [];
}
