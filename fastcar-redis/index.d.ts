import { FastCarApplication, Logger } from "fastcar-core";
import * as redis from "redis";

export class RedisDataSource {
	private client: redis.RedisClient;

	checkClient(): void;

	getClient(): redis.RedisClient;

	close(): void;
}

export class RedisDataSourceManager {
	//数据源
	protected sourceMap: Map<string, RedisDataSource>;

	protected app: FastCarApplication;
	protected sysLogger: Logger;

	start(): void;

	stop(): void;

	//source 默认default
	getClient(source?: string): redis.RedisClient | null;
}

//redis操作的模板类 可以直接进行拓展
export class RedisTemplate {
	private db: RedisDataSourceManager;

	protected sysLogger: Logger;

	set(key: string, value: string | Object, source?: string): Promise<string>;

	setExpire(key: string, value: string | Object, seconds: number, source?: string): Promise<number>;

	get(key: string, source?: string): Promise<string | null>;
	//自增key键
	incrKey(key: string, source?: string): Promise<number>;

	//自减key键
	decrKey(key: string, source?: string): Promise<number>;

	//是否存在key
	existKey(key: string, source?: string): Promise<boolean>;

	//获取批量键值对
	getBulkKey(key: string, source?: string): Promise<string[]>;

	delKey(key: string, source?: string): Promise<boolean>;

	delKeys(key: string, source?: string): Promise<boolean>;

	//执行lua脚本
	execLua(luaStr: string, keysLength: number, param: string, source?: string): Promise<any>;
}
