import { DataMap } from "fastcar-core";
import DBClientService from "./dbclient/DBClientService";

export type Store = string; //分类

export type DBItem = {
	store: Store; //存储的对象
	data: DataMap<string, any>; //存放key
	initSync: boolean; //是否需要初始化同步
	syncTimer: number; //多少秒同步一次 仅持久化 0 为立即同步
	ttl: number; //0 代表永远不消失
	ttlMap: DataMap<string, number>; //过期需删除的key值
	dbClient?: DBClientService; //持久化存储的客户端
	syncMap?: DataMap<string, number>; //需要同步持久化的key
};

export type Item = {
	key: string;
	value: any;
	ttl: number; //对外暴露为秒 放入程序中运行为ms
};

export interface CacheConfigTarget {
	new (): CacheConfig;
}

export interface CacheConfig {
	store: Store;
	initSync?: boolean; //默认true
	syncTimer?: number; //默认立即同步 数值为0
	ttl?: number; //默认0 代表不会消失
	dbClient?: DBClientService; //持久化存储的客户端
}

export const CacheMappingSymbol = Symbol("CacheMappingSymbol");

export type CacheSetOptions = {
	ttl?: number;
	flush?: boolean;
};
