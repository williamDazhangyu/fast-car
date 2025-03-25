import { CacheConfigTarget, CacheMappingSymbol } from "../CacheType";

//缓存映射
export default function CacheMapping(fp: string) {
	return function (target: CacheConfigTarget) {
		let cacheList: string[] = Reflect.get(global, CacheMappingSymbol) || [];
		if (!Reflect.has(global, CacheMappingSymbol)) {
			Reflect.set(global, CacheMappingSymbol, cacheList);
		}

		cacheList.push(fp);
	};
}
