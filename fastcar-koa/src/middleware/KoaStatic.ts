import * as koaStatic from "koa-static";
import * as KoaRange from "koa-range";
import { FastCarApplication } from "fastcar-core";
import { KoaConfig } from "../type/KoaConfig";
import * as fs from "fs";
import * as path from "path";
import * as Koa from "koa";

//支持静态文件访问
export default function KoaStatic(app: FastCarApplication): Koa.Middleware[] {
	let mlist: Koa.Middleware[] = [];

	//采用koa-range使文件可以流式传播
	mlist.push(KoaRange);

	let koaConfig: KoaConfig = app.getSetting("koa");

	if (Array.isArray(koaConfig?.koaStatic)) {
		for (let fp of koaConfig.koaStatic) {
			let rp = path.join(app.getResourcePath(), fp);
			if (!fs.existsSync(fp)) {
				if (!fs.existsSync(rp)) {
					console.error(`${fp} is not found`);
					continue;
				} else {
					fp = rp;
				}
			}

			mlist.push(koaStatic(fp));
		}
	}

	return mlist;
}
