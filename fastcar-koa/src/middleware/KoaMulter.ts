import * as multer from "@koa/multer";
import { FastCarApplication } from "@fastcar/core";

//对文件内容做解析
export default function KoaMulter(app: FastCarApplication) {
	return multer().single();
}
