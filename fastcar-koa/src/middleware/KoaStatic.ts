import { FastCarApplication } from "@fastcar/core";
import { KoaConfig } from "../type/KoaConfig";
import * as fs from "fs";
import * as path from "path";
import * as Koa from "koa";

//支持静态文件访问
export default function KoaStatic(app: FastCarApplication): Koa.Middleware[] {
	const KoaRange = require("koa-range");

	let mlist: Koa.Middleware[] = [];

	//采用koa-range使文件可以流式传播
	mlist.push(KoaRange as any);

	let koaConfig: KoaConfig = app.getSetting("koa");

	if (!!koaConfig?.koaStatic) {
		const KoaMount = require("koa-mount");
		const koaStatic = require("koa-static");

		let keys = Object.keys(koaConfig?.koaStatic);
		if (keys.length > 0) {
			for (let key of keys) {
				let fp = koaConfig.koaStatic[key];
				let rp = path.join(app.getResourcePath(), fp);
				if (!fs.existsSync(fp)) {
					if (!fs.existsSync(rp)) {
						console.error(`${fp} is not found`);
						continue;
					} else {
						fp = rp;
					}
				}

				if (!key.startsWith("/")) {
					key = `/${key}`;
				}
				mlist.push(KoaMount(key, koaStatic(fp)) as any);
			}
		}
	}
	return mlist;
}
