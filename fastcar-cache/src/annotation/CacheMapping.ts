import { CacheConfigTarget, CacheMappingSymbol } from "../CacheType";

//缓存映射
export default function CacheMapping(target: CacheConfigTarget) {
	let cacheList: CacheConfigTarget[] = Reflect.get(global, CacheMappingSymbol) || [];
	cacheList.push(target);
	Reflect.set(global, CacheMappingSymbol, cacheList);
}
