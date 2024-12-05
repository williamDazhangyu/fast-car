import { FastCarApplication } from "@fastcar/core";

//对文件内容做解析
export default function KoaMulter(app: FastCarApplication) {
	const multer = require("@koa/multer");

	return multer().single();
}
