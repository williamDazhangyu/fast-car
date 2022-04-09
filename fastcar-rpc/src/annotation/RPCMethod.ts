import "reflect-metadata";
import { RpcMetaData } from "../constant/RpcMetaData";
import { MethodType } from "../types/RpcConfig";

export default function RPCMethod(url?: string) {
	return function (target: any, name: string, descriptor: PropertyDescriptor) {
		//默认取方法名
		if (!url) {
			url = name;
		}

		//格式化url 以/开头
		if (!url.startsWith("/")) {
			url = "/" + url;
		}

		let routerMap: Map<string, MethodType> = Reflect.getMetadata(RpcMetaData.RPCMethod, target);
		if (!routerMap) {
			routerMap = new Map();
			Reflect.defineMetadata(RpcMetaData.RPCMethod, routerMap, target);
		}

		let curr = routerMap.get(url);
		if (!curr) {
			routerMap.set(url, {
				url,
				method: name,
			});
		} else {
			if (url != curr.url) {
				console.warn(`The two URL names are inconsisten in (${name},${curr.method})`);
			}
		}
	};
}
