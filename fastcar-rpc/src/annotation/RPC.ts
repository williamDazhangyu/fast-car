import "reflect-metadata";
import { FormatStr } from "fastcar-core/utils";
import { MethodType, RpcUrl } from "../types/RpcConfig";
import { RpcMetaData } from "../constant/RpcMetaData";

export default function RPC(url?: string) {
	return function (target: any) {
		let tname = FormatStr.formatFirstToLow(target.name);
		let headUrl = url || tname;

		if (!headUrl.startsWith("/")) {
			headUrl = "/" + headUrl;
		}

		let routerMap: Map<RpcUrl, MethodType> = Reflect.getMetadata(RpcMetaData.RPCMethod, target.prototype);
		if (!!routerMap) {
			let newRouterMap: Map<RpcUrl, MethodType> = new Map();
			routerMap.forEach((item) => {
				let url = headUrl + item.url;
				newRouterMap.set(url, { url, method: item.method });
			});

			routerMap.clear();
			Reflect.defineMetadata(RpcMetaData.RPCMethod, newRouterMap, target.prototype);
		}
	};
}
