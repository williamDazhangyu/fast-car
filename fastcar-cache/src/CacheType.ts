import { DataMap } from "@fastcar/core";
import DBClientService from "./dbclient/DBClientService";

export type Store = string; //分类

export type QueueItem = {
	ttl: number; //剩余时间      秒
	interval: number; //间隔时长 秒
	failNum: number; //失败次数 默认三次
};

export type DBItem<T extends Object> = {
	store: Store; //存储的对象
	data: DataMap<string, T>; //存放key
	initSync: boolean; //是否需要初始化同步 自动拉取
	syncTimer: number; //多少秒同步一次 仅持久化 0 为立即同步
	ttl: number; //0 代表永远不消失
	ttlMap: DataMap<string, QueueItem>; //过期需删除的key值
	dbClient?: DBClientService<T>; //持久化存储的客户端
	syncMap?: DataMap<string, QueueItem>; //需要同步持久化的key
	failNum: number; //重试失败次数
	readonly?: boolean; //默认为false主动向db客户端存 false为调用db客户端向上拉  当为true时失去写入db功能
	dbSync?: boolean; //失效时是否需要删除db的缓存
};

export type Item<T> = {
	key: string;
	value: T;
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
	dbClient?: DBClientService<any>; //持久化存储的客户端
	failNum?: number; //失败后的重试次数 间隔为下一次的存储时间 默认失败重试为3次
	readonly?: boolean; //默认为false主动向db客户端存 false为调用db客户端向上拉  当为true时失去写入db功能
	dbSync?: boolean; //失效时是否需要删除db的缓存 默认为同步
}

export const CacheMappingSymbol = Symbol("CacheMappingSymbol");

export type CacheSetOptions = {
	ttl?: number;
	flush?: boolean; //立即同步
};
