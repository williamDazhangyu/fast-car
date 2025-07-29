//处理由于第三方头不规范导致的问题
import * as koa from "koa";

const ValidEncoding = ["gzip", "deflate", "br", "identity"];

export default function HeaderCoding() {
	return async function (ctx: koa.Context, next: Function) {
		let encoding = ctx.headers["content-encoding"];
		if (encoding && !ValidEncoding.includes(encoding)) {
			delete ctx.headers["content-encoding"];
		}
		await next();
	};
}
