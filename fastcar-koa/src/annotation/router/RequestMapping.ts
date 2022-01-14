import "reflect-metadata";
import { MethodType } from "../../type/MethodType";
import { DesignMeta } from "../../type/DesignMeta";

//加载值头部的url
export default function RequestMapping(url: string) {
	return function(target: any) {
		if (!url.startsWith("/")) {
			url = "/" + url;
		}
		let routerMap: Map<string, MethodType> = Reflect.getMetadata(DesignMeta.ROUTER_MAP, target.prototype);
		if (!!routerMap) {
			routerMap.forEach(item => {
				item.url = url + item.url;
			});
		}
	};
}
