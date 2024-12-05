import { FastCarApplication } from "@fastcar/core";
import { KoaConfig } from "../type/KoaConfig";

//对文件内容做解析
export default function KoaBodyParser(app: FastCarApplication) {
	const bodyParser = require("koa-bodyparser");

	let koaConfig: KoaConfig = app.getSetting("koa");
	let bodyConfig = koaConfig?.koaBodyParser;

	return bodyParser(bodyConfig);
}
