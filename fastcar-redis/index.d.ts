import { FastCarApplication, Logger } from "@fastcar/core";
import { RedisClientOptions, RedisClientType } from "redis";

export interface RedisDataSourceConfig extends RedisClientOptions {
	host?: string;
	port?: number;
	path?: string;
	tls?: boolean;
}

export type RedisValue = string | number | boolean | Object;
export type RedisCommand = Array<string | number | Buffer>;
export type RedisSubscribeHandler = (message: string, channel: string) => void | Promise<void>;
export type RedisUnsubscribe = () => Promise<void>;
export type RedisZMember = {
	score: number;
	value: string;
};

export class RedisDataSource {
	private client: RedisClientType;

	constructor(config: RedisDataSourceConfig);

	connect(): Promise<void>;

	checkClient(): Promise<void>;

	getClient(): RedisClientType;

	close(): Promise<void>;
}

export class RedisDataSourceManager {
	protected sourceMap: Map<string, RedisDataSource>;

	protected app: FastCarApplication;
	protected sysLogger: Logger;

	start(): Promise<void>;

	stop(): Promise<void>;

	getClient(source?: string): RedisClientType | null;
}

export class RedisTemplate {
	private db: RedisDataSourceManager;

	protected sysLogger: Logger;

	set(key: string, value: RedisValue, source?: string): Promise<string>;

	setExpire(key: string, value: RedisValue, seconds: number, source?: string): Promise<number>;

	setEx(key: string, value: RedisValue, seconds: number, source?: string): Promise<number>;

	setNx(key: string, value: RedisValue, seconds?: number, source?: string): Promise<boolean>;

	get(key: string, source?: string): Promise<string | null>;

	getJson<T = any>(key: string, source?: string): Promise<T | null>;

	setJson(key: string, value: Object, seconds?: number, source?: string): Promise<string | number>;

	mGet(keys: string[], source?: string): Promise<Array<string | null>>;

	mSet(values: Record<string, RedisValue>, source?: string): Promise<string>;

	incrKey(key: string, source?: string): Promise<number>;

	incr(key: string, source?: string): Promise<number>;

	decrKey(key: string, source?: string): Promise<number>;

	decr(key: string, source?: string): Promise<number>;

	existKey(key: string, source?: string): Promise<boolean>;

	exists(key: string, source?: string): Promise<boolean>;

	getBulkKey(key: string, source?: string): Promise<string[]>;

	keys(pattern: string, source?: string): Promise<string[]>;

	scan(pattern?: string, count?: number, source?: string): Promise<string[]>;

	delKey(key: string, source?: string): Promise<boolean>;

	del(keys: string[], source?: string): Promise<number>;

	delKeys(pattern: string, source?: string): Promise<number>;

	expire(key: string, seconds: number, source?: string): Promise<boolean>;

	ttl(key: string, source?: string): Promise<number>;

	persist(key: string, source?: string): Promise<boolean>;

	rename(key: string, newKey: string, source?: string): Promise<string>;

	type(key: string, source?: string): Promise<string>;

	hSet(key: string, field: string, value: RedisValue, source?: string): Promise<number>;

	hGet(key: string, field: string, source?: string): Promise<string | null>;

	hGetAll(key: string, source?: string): Promise<Record<string, string>>;

	hDel(key: string, fields: string[], source?: string): Promise<number>;

	hExists(key: string, field: string, source?: string): Promise<boolean>;

	hIncrBy(key: string, field: string, increment: number, source?: string): Promise<number>;

	lPush(key: string, values: RedisValue[], source?: string): Promise<number>;

	rPush(key: string, values: RedisValue[], source?: string): Promise<number>;

	lPop(key: string, source?: string): Promise<string | null>;

	rPop(key: string, source?: string): Promise<string | null>;

	lRange(key: string, start: number, stop: number, source?: string): Promise<string[]>;

	lLen(key: string, source?: string): Promise<number>;

	sAdd(key: string, members: RedisValue[], source?: string): Promise<number>;

	sRem(key: string, members: RedisValue[], source?: string): Promise<number>;

	sMembers(key: string, source?: string): Promise<string[]>;

	sIsMember(key: string, member: RedisValue, source?: string): Promise<boolean>;

	sCard(key: string, source?: string): Promise<number>;

	zAdd(key: string, score: number, member: RedisValue, source?: string): Promise<number>;

	zRem(key: string, members: RedisValue[], source?: string): Promise<number>;

	zRange(key: string, start: number, stop: number, source?: string): Promise<string[]>;

	zRevRange(key: string, start: number, stop: number, source?: string): Promise<string[]>;

	zRangeWithScores(key: string, start: number, stop: number, source?: string): Promise<RedisZMember[]>;

	zScore(key: string, member: RedisValue, source?: string): Promise<number | null>;

	pipeline(commands: RedisCommand[], source?: string): Promise<unknown[]>;

	transaction(commands: RedisCommand[], source?: string): Promise<unknown[]>;

	publish(channel: string, message: RedisValue, source?: string): Promise<number>;

	subscribe(channel: string, handler: RedisSubscribeHandler, source?: string): Promise<RedisUnsubscribe>;

	pSubscribe(pattern: string, handler: RedisSubscribeHandler, source?: string): Promise<RedisUnsubscribe>;

	eval(luaStr: string, keys?: string[], args?: RedisValue[], source?: string): Promise<any>;

	evalSha(sha: string, keys?: string[], args?: RedisValue[], source?: string): Promise<any>;

	execLua(luaStr: string, keysLength: number, param: string, source?: string): Promise<any>;

	rawCommand<T = any>(command: RedisCommand, source?: string): Promise<T>;
}
