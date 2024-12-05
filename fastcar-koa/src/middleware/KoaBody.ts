import { FastCarApplication } from "@fastcar/core";
import { KoaConfig } from "../type/KoaConfig";

//对于文件上传做限定
export default function KoaBody(app: FastCarApplication) {
	const koaBodyfn = require("koa-body").default;

	let koaConfig: KoaConfig = app.getSetting("koa");
	let bodyConfig = koaConfig?.koaBodyOptions;

	return koaBodyfn(bodyConfig);
}
