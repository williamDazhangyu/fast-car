import "reflect-metadata";
import { MethodType } from "../../type/MethodType";
import { DesignMeta } from "../../type/DesignMeta";
import { FormatStr } from "@fastcar/core/utils";

//加载值头部的url
export default function RequestMapping(url?: string) {
	return function (target: any) {
		let tname = FormatStr.formatFirstToLow(target.name);
		let headUrl = url || tname;

		if (!headUrl.startsWith("/")) {
			headUrl = "/" + headUrl;
		}

		let routerMap: Map<string, MethodType> = Reflect.getMetadata(DesignMeta.ROUTER_MAP, target.prototype);
		if (!!routerMap) {
			routerMap.forEach((item) => {
				item.url = headUrl + item.url;
			});
		}
	};
}
