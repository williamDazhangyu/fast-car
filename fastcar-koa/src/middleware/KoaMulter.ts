//对文件内容做解析
export default function KoaMulter() {
	const multer = require("@koa/multer");

	return multer().single();
}
