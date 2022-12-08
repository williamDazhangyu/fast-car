import * as koaBody from "koa-body";
import { FastCarApplication } from "@fastcar/core";
import { KoaConfig } from "../type/KoaConfig";

//对于文件上传做限定
export default function KoaBody(app: FastCarApplication) {
	let koaConfig: KoaConfig = app.getSetting("koa");
	let bodyConfig = koaConfig?.koaBodyOptions;

	return koaBody(bodyConfig);
}
