import "reflect-metadata";
import { MethodType } from "../../type/MethodType";
import { DesignMeta } from "../../type/DesignMeta";

export default function AddMapping(target: any, info: MethodType) {
	//格式化url 以/开头
	if (!info.url.startsWith("/")) {
		info.url = "/" + info.url;
	}

	let routerMap: Map<string, MethodType> = Reflect.getMetadata(DesignMeta.ROUTER_MAP, target);
	if (!routerMap) {
		routerMap = new Map();
		Reflect.defineMetadata(DesignMeta.ROUTER_MAP, routerMap, target);
	}

	let curr = routerMap.get(info.url);
	if (!curr) {
		routerMap.set(info.url, info);
	} else {
		if (info.url != curr.url) {
			console.warn(`The two URL names are inconsisten in (${info.url},${curr.url})`);
		}
		curr.request = [...info.request, ...curr.request];
	}
}
