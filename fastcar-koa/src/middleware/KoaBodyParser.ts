import { FastCarApplication } from "@fastcar/core";
import { KoaConfig } from "../type/KoaConfig";
import bodyParser from "@koa/bodyparser";

//对文件内容做解析
export default function KoaBodyParser(app: FastCarApplication) {
	let koaConfig: KoaConfig = app.getSetting("koa");
	let bodyConfig = koaConfig?.koaBodyParser;

	return bodyParser(bodyConfig as any);
}
