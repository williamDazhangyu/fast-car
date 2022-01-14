import { FastCarApplication } from "fastcar-core";
import * as koa2Cors from "koa2-cors";
import { KoaConfig } from "../type/KoaConfig";

export default function KoaCors(app: FastCarApplication) {
	let koaConfig: KoaConfig = app.getSetting("koa");
	if (koaConfig?.extra) {
		let corsConfig: koa2Cors.Options = Reflect.get(koaConfig.extra, "cors");
		return koa2Cors(corsConfig);
	}

	return [];
}
