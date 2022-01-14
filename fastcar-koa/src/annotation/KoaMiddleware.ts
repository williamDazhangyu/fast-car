import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";
import { FastCarApplication } from "fastcar-core";
import * as Koa from "koa";

type MiddleWareType = (...args: any) => Koa.Middleware | Koa.Middleware[];

//加载koa中间件
export default function KoaMiddleware(...args: MiddleWareType[]) {
	return function(target: any) {
		let middlewareList: MiddleWareType[] = Reflect.getMetadata(DesignMeta.KoaMIDDLEWARE, FastCarApplication.prototype);
		if (!middlewareList) {
			middlewareList = args;
		} else {
			//由于注解方式是从下至上运行 和我们理解的书写习惯不一样，所以这边做了一个反序
			middlewareList = [...args, ...middlewareList];
		}
		Reflect.defineMetadata(DesignMeta.KoaMIDDLEWARE, middlewareList, FastCarApplication.prototype);
	};
}
