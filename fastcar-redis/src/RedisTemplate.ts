import { Autowired, DSIndex, Log } from "@fastcar/core/annotation";
import RedisDataSourceManager from "./RedisDataSourceManager";
import { Logger } from "@fastcar/core";
import { RedisClientType } from "redis";

export type RedisValue = string | number | boolean | Object;
export type RedisCommand = Array<string | number | Buffer>;
export type RedisSubscribeHandler = (message: string, channel: string) => void | Promise<void>;
export type RedisUnsubscribe = () => Promise<void>;
export type RedisZMember = {
	score: number;
	value: string;
};

/***
 * Redis 常用操作模板。
 *
 * 该类对 `redis@5` 的 `sendCommand` 做了一层业务友好的封装，覆盖字符串缓存、
 * Key/TTL、Hash、List、Set、ZSet、Pipeline、Transaction、Pub/Sub、Lua 等常用能力。
 * 所有公开方法的最后一个 `source` 参数都用于指定 Redis 数据源；不传时使用当前
 * `@DS` 或默认数据源。
 *
 * @version 1.0 redis operation template
 */
export default class RedisTemplate {
	@Autowired
	private db!: RedisDataSourceManager;

	@Log("redis")
	protected sysLogger!: Logger;

	/**
	 * 设置 key 的值，对象类型会自动执行 `JSON.stringify`。
	 *
	 * 对应 Redis `SET key value` 命令，成功返回 Redis 的 `OK`。
	 */
	async set(key: string, value: RedisValue, @DSIndex source?: string): Promise<string> {
		let res = await this.rawCommand<string>(["SET", key, this.stringifyValue(value)], source);
		if (!res) {
			throw new Error("redis set failed");
		}
		return res;
	}

	/**
	 * 设置 key 的值并指定过期时间。
	 *
	 * 这是 `setEx` 的兼容旧名，适合缓存 token、验证码等需要 TTL 的数据。
	 */
	async setExpire(key: string, value: RedisValue, seconds: number, @DSIndex source?: string): Promise<number> {
		return this.setEx(key, value, seconds, source);
	}

	/**
	 * 设置 key 的值并指定秒级过期时间。
	 *
	 * 对应 Redis `SET key value EX seconds` 命令，方法成功执行后返回 `1`。
	 */
	async setEx(key: string, value: RedisValue, seconds: number, @DSIndex source?: string): Promise<number> {
		await this.rawCommand(["SET", key, this.stringifyValue(value), "EX", seconds], source);
		return 1;
	}

	/**
	 * 仅当 key 不存在时才设置值，可选设置秒级过期时间。
	 *
	 * 对应 Redis `SET key value NX [EX seconds]`，常用于简单分布式锁或防重复写入。
	 * 返回 `true` 表示设置成功，返回 `false` 表示 key 已存在。
	 */
	async setNx(key: string, value: RedisValue, seconds?: number, @DSIndex source?: string): Promise<boolean> {
		let args: RedisCommand = ["SET", key, this.stringifyValue(value), "NX"];
		if (seconds !== undefined) {
			args.push("EX", seconds);
		}
		let res = await this.rawCommand<string | null>(args, source);
		return res === "OK";
	}

	/**
	 * 获取 key 的字符串值。
	 *
	 * 对应 Redis `GET key` 命令，key 不存在时返回 `null`。
	 */
	get(key: string, @DSIndex source?: string): Promise<string | null> {
		return this.rawCommand<string | null>(["GET", key], source);
	}

	/**
	 * 获取 key 的值并按 JSON 解析。
	 *
	 * 适合读取 `setJson` 或传入对象的 `set`/`setEx` 写入的数据。
	 * key 不存在时返回 `null`；值不是合法 JSON 时会抛出 `JSON.parse` 异常。
	 */
	async getJson<T = any>(key: string, @DSIndex source?: string): Promise<T | null> {
		let value = await this.get(key, source);
		if (value === null) {
			return null;
		}
		return JSON.parse(value) as T;
	}

	/**
	 * 设置 JSON 对象，可选指定秒级过期时间。
	 *
	 * 未传 `seconds` 时等同于 `set`；传入 `seconds` 时等同于 `setEx`。
	 */
	setJson(key: string, value: Object, seconds?: number, @DSIndex source?: string): Promise<string | number> {
		if (seconds !== undefined) {
			return this.setEx(key, value, seconds, source);
		}
		return this.set(key, value, source);
	}

	/**
	 * 批量获取多个 key 的字符串值。
	 *
	 * 对应 Redis `MGET`，返回结果顺序与 `keys` 参数顺序一致，不存在的 key 返回 `null`。
	 */
	mGet(keys: string[], @DSIndex source?: string): Promise<Array<string | null>> {
		return this.rawCommand<Array<string | null>>(["MGET", ...keys], source);
	}

	/**
	 * 批量设置多个 key 的值。
	 *
	 * 对应 Redis `MSET`，对象类型值会自动序列化为 JSON 字符串。
	 */
	async mSet(values: Record<string, RedisValue>, @DSIndex source?: string): Promise<string> {
		let args: RedisCommand = ["MSET"];
		Object.entries(values).forEach(([key, value]) => {
			args.push(key, this.stringifyValue(value));
		});
		return this.rawCommand<string>(args, source);
	}

	/**
	 * 将 key 对应的数字值自增 1。
	 *
	 * 这是 `incr` 的兼容旧名。
	 */
	async incrKey(key: string, @DSIndex source?: string): Promise<number> {
		return this.incr(key, source);
	}

	/**
	 * 将 key 对应的数字值自增 1。
	 *
	 * 对应 Redis `INCR`，返回自增后的数值；key 不存在时 Redis 会从 0 开始。
	 */
	incr(key: string, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["INCR", key], source);
	}

	/**
	 * 将 key 对应的数字值自减 1。
	 *
	 * 这是 `decr` 的兼容旧名。
	 */
	async decrKey(key: string, @DSIndex source?: string): Promise<number> {
		return this.decr(key, source);
	}

	/**
	 * 将 key 对应的数字值自减 1。
	 *
	 * 对应 Redis `DECR`，返回自减后的数值；key 不存在时 Redis 会从 0 开始。
	 */
	decr(key: string, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["DECR", key], source);
	}

	/**
	 * 判断 key 是否存在。
	 *
	 * 这是 `exists` 的兼容旧名。
	 */
	async existKey(key: string, @DSIndex source?: string): Promise<boolean> {
		return this.exists(key, source);
	}

	/**
	 * 判断 key 是否存在。
	 *
	 * 对应 Redis `EXISTS`，存在返回 `true`，不存在返回 `false`。
	 */
	async exists(key: string, @DSIndex source?: string): Promise<boolean> {
		let data = await this.rawCommand<number>(["EXISTS", key], source);
		return data > 0;
	}

	/**
	 * 按 pattern 获取匹配的 key。
	 *
	 * 这是 `keys` 的兼容旧名；生产环境大 key 空间建议优先使用 `scan`。
	 */
	getBulkKey(key: string, @DSIndex source?: string): Promise<string[]> {
		return this.keys(key, source);
	}

	/**
	 * 按 pattern 获取匹配的 key。
	 *
	 * 对应 Redis `KEYS`，会阻塞扫描整个 key 空间，生产环境应谨慎使用。
	 */
	keys(pattern: string, @DSIndex source?: string): Promise<string[]> {
		return this.rawCommand<string[]>(["KEYS", pattern], source);
	}

	/**
	 * 使用游标扫描获取匹配的 key。
	 *
	 * 基于 Redis `SCAN`，`pattern` 默认为 `*`，`count` 是每次扫描的建议数量。
	 * 比 `keys` 更适合生产环境批量遍历 key。
	 */
	async scan(pattern: string = "*", count: number = 100, @DSIndex source?: string): Promise<string[]> {
		let client = this.getClient(source);
		let keys: string[] = [];
		for await (let page of client.scanIterator({ MATCH: pattern, COUNT: count })) {
			keys.push(...page);
		}
		return keys;
	}

	/**
	 * 删除单个 key。
	 *
	 * 对应 Redis `DEL`，删除成功返回 `true`，key 不存在返回 `false`。
	 */
	async delKey(key: string, @DSIndex source?: string): Promise<boolean> {
		let res = await this.del([key], source);
		return res > 0;
	}

	/**
	 * 删除多个 key。
	 *
	 * 对应 Redis `DEL`，返回实际删除的 key 数量；传入空数组时直接返回 0。
	 */
	del(keys: string[], @DSIndex source?: string): Promise<number> {
		if (keys.length === 0) {
			return Promise.resolve(0);
		}
		return this.rawCommand<number>(["DEL", ...keys], source);
	}

	/**
	 * 按 pattern 批量删除 key。
	 *
	 * 内部使用 `scan` 找到匹配 key 后再执行 `del`，返回删除数量。
	 */
	async delKeys(pattern: string, @DSIndex source?: string): Promise<number> {
		let keys = await this.scan(pattern, 100, source);
		return this.del(keys, source);
	}

	/**
	 * 设置 key 的秒级过期时间。
	 *
	 * 对应 Redis `EXPIRE`，设置成功返回 `true`。
	 */
	expire(key: string, seconds: number, @DSIndex source?: string): Promise<boolean> {
		return this.integerToBoolean(["EXPIRE", key, seconds], source);
	}

	/**
	 * 获取 key 的剩余过期时间。
	 *
	 * 对应 Redis `TTL`，单位为秒；Redis 会用 `-1` 表示无过期时间，`-2` 表示 key 不存在。
	 */
	ttl(key: string, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["TTL", key], source);
	}

	/**
	 * 移除 key 的过期时间，使其变为永久 key。
	 *
	 * 对应 Redis `PERSIST`，移除成功返回 `true`。
	 */
	persist(key: string, @DSIndex source?: string): Promise<boolean> {
		return this.integerToBoolean(["PERSIST", key], source);
	}

	/**
	 * 重命名 key。
	 *
	 * 对应 Redis `RENAME`，成功返回 `OK`；目标 key 已存在时会被覆盖。
	 */
	rename(key: string, newKey: string, @DSIndex source?: string): Promise<string> {
		return this.rawCommand<string>(["RENAME", key, newKey], source);
	}

	/**
	 * 获取 key 的 Redis 数据类型。
	 *
	 * 对应 Redis `TYPE`，常见返回值包括 `string`、`hash`、`list`、`set`、`zset`、`none`。
	 */
	type(key: string, @DSIndex source?: string): Promise<string> {
		return this.rawCommand<string>(["TYPE", key], source);
	}

	/**
	 * 设置 hash 中指定 field 的值。
	 *
	 * 对应 Redis `HSET`，返回新增字段数量；更新已有字段时通常返回 0。
	 */
	hSet(key: string, field: string, value: RedisValue, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["HSET", key, field, this.stringifyValue(value)], source);
	}

	/**
	 * 获取 hash 中指定 field 的值。
	 *
	 * 对应 Redis `HGET`，字段不存在时返回 `null`。
	 */
	hGet(key: string, field: string, @DSIndex source?: string): Promise<string | null> {
		return this.rawCommand<string | null>(["HGET", key, field], source);
	}

	/**
	 * 获取 hash 的所有字段和值。
	 *
	 * 对应 Redis `HGETALL`，返回普通对象；hash 不存在时返回空对象。
	 */
	async hGetAll(key: string, @DSIndex source?: string): Promise<Record<string, string>> {
		let res = await this.rawCommand<any>(["HGETALL", key], source);
		if (Array.isArray(res)) {
			let map: Record<string, string> = {};
			for (let i = 0; i < res.length; i += 2) {
				map[String(res[i])] = String(res[i + 1]);
			}
			return map;
		}
		return res || {};
	}

	/**
	 * 删除 hash 中的一个或多个 field。
	 *
	 * 对应 Redis `HDEL`，返回实际删除的字段数量；传入空数组时直接返回 0。
	 */
	hDel(key: string, fields: string[], @DSIndex source?: string): Promise<number> {
		if (fields.length === 0) {
			return Promise.resolve(0);
		}
		return this.rawCommand<number>(["HDEL", key, ...fields], source);
	}

	/**
	 * 判断 hash 中的 field 是否存在。
	 *
	 * 对应 Redis `HEXISTS`，存在返回 `true`。
	 */
	hExists(key: string, field: string, @DSIndex source?: string): Promise<boolean> {
		return this.integerToBoolean(["HEXISTS", key, field], source);
	}

	/**
	 * 将 hash 中指定 field 的整数值按步长递增。
	 *
	 * 对应 Redis `HINCRBY`，返回递增后的值。
	 */
	hIncrBy(key: string, field: string, increment: number, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["HINCRBY", key, field, increment], source);
	}

	/**
	 * 将一个或多个值从列表左侧推入。
	 *
	 * 对应 Redis `LPUSH`，返回推入后列表长度；传入空数组时返回 0。
	 */
	lPush(key: string, values: RedisValue[], @DSIndex source?: string): Promise<number> {
		return this.pushValues("LPUSH", key, values, source);
	}

	/**
	 * 将一个或多个值从列表右侧推入。
	 *
	 * 对应 Redis `RPUSH`，返回推入后列表长度；传入空数组时返回 0。
	 */
	rPush(key: string, values: RedisValue[], @DSIndex source?: string): Promise<number> {
		return this.pushValues("RPUSH", key, values, source);
	}

	/**
	 * 从列表左侧弹出一个值。
	 *
	 * 对应 Redis `LPOP`，列表为空或 key 不存在时返回 `null`。
	 */
	lPop(key: string, @DSIndex source?: string): Promise<string | null> {
		return this.rawCommand<string | null>(["LPOP", key], source);
	}

	/**
	 * 从列表右侧弹出一个值。
	 *
	 * 对应 Redis `RPOP`，列表为空或 key 不存在时返回 `null`。
	 */
	rPop(key: string, @DSIndex source?: string): Promise<string | null> {
		return this.rawCommand<string | null>(["RPOP", key], source);
	}

	/**
	 * 获取列表指定范围内的元素。
	 *
	 * 对应 Redis `LRANGE`，`start` 和 `stop` 支持负数下标，例如 `0, -1` 表示全部。
	 */
	lRange(key: string, start: number, stop: number, @DSIndex source?: string): Promise<string[]> {
		return this.rawCommand<string[]>(["LRANGE", key, start, stop], source);
	}

	/**
	 * 获取列表长度。
	 *
	 * 对应 Redis `LLEN`，key 不存在时返回 0。
	 */
	lLen(key: string, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["LLEN", key], source);
	}

	/**
	 * 向 set 添加一个或多个成员。
	 *
	 * 对应 Redis `SADD`，返回实际新增的成员数量；传入空数组时返回 0。
	 */
	sAdd(key: string, members: RedisValue[], @DSIndex source?: string): Promise<number> {
		return this.pushValues("SADD", key, members, source);
	}

	/**
	 * 从 set 删除一个或多个成员。
	 *
	 * 对应 Redis `SREM`，返回实际删除的成员数量；传入空数组时返回 0。
	 */
	sRem(key: string, members: RedisValue[], @DSIndex source?: string): Promise<number> {
		return this.pushValues("SREM", key, members, source);
	}

	/**
	 * 获取 set 的全部成员。
	 *
	 * 对应 Redis `SMEMBERS`，key 不存在时返回空数组。
	 */
	sMembers(key: string, @DSIndex source?: string): Promise<string[]> {
		return this.rawCommand<string[]>(["SMEMBERS", key], source);
	}

	/**
	 * 判断成员是否在 set 中。
	 *
	 * 对应 Redis `SISMEMBER`，存在返回 `true`。
	 */
	sIsMember(key: string, member: RedisValue, @DSIndex source?: string): Promise<boolean> {
		return this.integerToBoolean(["SISMEMBER", key, this.stringifyValue(member)], source);
	}

	/**
	 * 获取 set 的成员数量。
	 *
	 * 对应 Redis `SCARD`，key 不存在时返回 0。
	 */
	sCard(key: string, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["SCARD", key], source);
	}

	/**
	 * 向有序集合添加成员及其分数。
	 *
	 * 对应 Redis `ZADD`，返回新增成员数量；更新已有成员分数时通常返回 0。
	 */
	zAdd(key: string, score: number, member: RedisValue, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["ZADD", key, score, this.stringifyValue(member)], source);
	}

	/**
	 * 从有序集合删除一个或多个成员。
	 *
	 * 对应 Redis `ZREM`，返回实际删除的成员数量；传入空数组时返回 0。
	 */
	zRem(key: string, members: RedisValue[], @DSIndex source?: string): Promise<number> {
		return this.pushValues("ZREM", key, members, source);
	}

	/**
	 * 按分数从小到大获取有序集合指定排名范围内的成员。
	 *
	 * 对应 Redis `ZRANGE`，`start` 和 `stop` 支持负数下标。
	 */
	zRange(key: string, start: number, stop: number, @DSIndex source?: string): Promise<string[]> {
		return this.rawCommand<string[]>(["ZRANGE", key, start, stop], source);
	}

	/**
	 * 按分数从大到小获取有序集合指定排名范围内的成员。
	 *
	 * 对应 Redis `ZREVRANGE`，适合排行榜倒序展示。
	 */
	zRevRange(key: string, start: number, stop: number, @DSIndex source?: string): Promise<string[]> {
		return this.rawCommand<string[]>(["ZREVRANGE", key, start, stop], source);
	}

	/**
	 * 按分数从小到大获取有序集合成员，并同时返回 score。
	 *
	 * 对应 Redis `ZRANGE ... WITHSCORES`，返回 `{ value, score }` 数组。
	 */
	async zRangeWithScores(key: string, start: number, stop: number, @DSIndex source?: string): Promise<RedisZMember[]> {
		let res = await this.rawCommand<string[]>(["ZRANGE", key, start, stop, "WITHSCORES"], source);
		let list: RedisZMember[] = [];
		for (let i = 0; i < res.length; i += 2) {
			list.push({
				value: res[i],
				score: Number(res[i + 1]),
			});
		}
		return list;
	}

	/**
	 * 获取有序集合中指定成员的 score。
	 *
	 * 对应 Redis `ZSCORE`，成员不存在时返回 `null`。
	 */
	async zScore(key: string, member: RedisValue, @DSIndex source?: string): Promise<number | null> {
		let score = await this.rawCommand<string | null>(["ZSCORE", key, this.stringifyValue(member)], source);
		return score === null ? null : Number(score);
	}

	/**
	 * 执行 Redis pipeline。
	 *
	 * pipeline 会一次性发送多条命令以减少网络往返，但不保证事务原子性。
	 * 返回值顺序与 `commands` 顺序一致。
	 */
	pipeline(commands: RedisCommand[], @DSIndex source?: string): Promise<unknown[]> {
		let multi = this.getClient(source).multi();
		commands.forEach((command) => multi.addCommand(this.normalizeCommand(command)));
		return multi.execAsPipeline() as Promise<unknown[]>;
	}

	/**
	 * 执行 Redis transaction。
	 *
	 * 基于 Redis `MULTI/EXEC`，用于把多条命令作为事务提交。
	 * 返回值顺序与 `commands` 顺序一致。
	 */
	transaction(commands: RedisCommand[], @DSIndex source?: string): Promise<unknown[]> {
		let multi = this.getClient(source).multi();
		commands.forEach((command) => multi.addCommand(this.normalizeCommand(command)));
		return multi.exec() as Promise<unknown[]>;
	}

	/**
	 * 向频道发布消息。
	 *
	 * 对应 Redis `PUBLISH`，返回收到消息的订阅者数量；对象消息会自动 JSON 序列化。
	 */
	publish(channel: string, message: RedisValue, @DSIndex source?: string): Promise<number> {
		return this.rawCommand<number>(["PUBLISH", channel, this.stringifyValue(message)], source);
	}

	/**
	 * 订阅指定频道。
	 *
	 * 内部会复制一个独立 Redis 连接用于订阅，返回的函数用于取消订阅并关闭该连接。
	 */
	async subscribe(channel: string, handler: RedisSubscribeHandler, @DSIndex source?: string): Promise<RedisUnsubscribe> {
		let client = this.getClient(source).duplicate();
		await client.connect();
		let listener = async (message: string, subscribedChannel: string) => {
			await handler(message, subscribedChannel);
		};
		await client.subscribe(channel, listener);
		return async () => {
			await client.unsubscribe(channel, listener);
			await client.close();
		};
	}

	/**
	 * 按 pattern 订阅频道。
	 *
	 * 对应 Redis `PSUBSCRIBE`，例如 `notice:*` 可以匹配多个频道。
	 * 返回的函数用于取消 pattern 订阅并关闭独立连接。
	 */
	async pSubscribe(pattern: string, handler: RedisSubscribeHandler, @DSIndex source?: string): Promise<RedisUnsubscribe> {
		let client = this.getClient(source).duplicate();
		await client.connect();
		let listener = async (message: string, subscribedChannel: string) => {
			await handler(message, subscribedChannel);
		};
		await client.pSubscribe(pattern, listener);
		return async () => {
			await client.pUnsubscribe(pattern, listener);
			await client.close();
		};
	}

	/**
	 * 执行 Lua 脚本。
	 *
	 * 对应 Redis `EVAL script numkeys key... arg...`，`keys` 会作为 `KEYS`，`args` 会作为 `ARGV`。
	 */
	eval(luaStr: string, keys: string[] = [], args: RedisValue[] = [], @DSIndex source?: string): Promise<any> {
		return this.rawCommand(["EVAL", luaStr, keys.length, ...keys, ...args.map((item) => this.stringifyValue(item))], source);
	}

	/**
	 * 通过脚本 SHA 执行已缓存的 Lua 脚本。
	 *
	 * 对应 Redis `EVALSHA sha numkeys key... arg...`，适合配合 `SCRIPT LOAD` 后复用脚本。
	 */
	evalSha(sha: string, keys: string[] = [], args: RedisValue[] = [], @DSIndex source?: string): Promise<any> {
		return this.rawCommand(["EVALSHA", sha, keys.length, ...keys, ...args.map((item) => this.stringifyValue(item))], source);
	}

	/**
	 * 执行 Lua 脚本的兼容旧方法。
	 *
	 * 该方法只接收一个 `param` 参数；新代码建议优先使用 `eval` 或 `evalSha`。
	 */
	execLua(luaStr: string, keysLength: number, param: string, @DSIndex source?: string): Promise<any> {
		return this.rawCommand(["EVAL", luaStr, keysLength, param], source);
	}

	/**
	 * 执行原始 Redis 命令。
	 *
	 * 适合调用模板尚未封装的命令；数字参数会被转换为字符串后发送给 Redis。
	 */
	rawCommand<T = any>(command: RedisCommand, @DSIndex source?: string): Promise<T> {
		return this.getClient(source).sendCommand<T>(this.normalizeCommand(command));
	}

	/**
	 * 根据数据源名称获取 Redis 客户端。
	 *
	 * 未找到对应数据源时抛出异常，避免后续命令在空客户端上执行。
	 */
	protected getClient(source?: string): RedisClientType {
		let client = this.db.getClient(source);
		if (!client) {
			throw new Error("redis source not found");
		}
		return client;
	}

	/**
	 * 将模板支持的值转换成 Redis 可存储的字符串。
	 *
	 * 对象会被 JSON 序列化，字符串、数字、布尔值会转换为普通字符串。
	 */
	protected stringifyValue(value: RedisValue): string {
		return typeof value == "object" ? JSON.stringify(value) : String(value);
	}

	/**
	 * 执行返回整数的 Redis 命令，并将大于 0 的结果转换为 `true`。
	 *
	 * 用于 `EXISTS`、`EXPIRE`、`HEXISTS` 等 Redis 布尔语义命令。
	 */
	private integerToBoolean(command: RedisCommand, source?: string): Promise<boolean> {
		return this.rawCommand<number>(command, source).then((res) => res > 0);
	}

	/**
	 * 执行批量追加/删除值的 Redis 命令。
	 *
	 * 复用 `LPUSH`、`RPUSH`、`SADD`、`SREM`、`ZREM` 等命令的参数拼装逻辑。
	 */
	private pushValues(command: string, key: string, values: RedisValue[], source?: string): Promise<number> {
		if (values.length === 0) {
			return Promise.resolve(0);
		}
		return this.rawCommand<number>([command, key, ...values.map((item) => this.stringifyValue(item))], source);
	}

	/**
	 * 标准化 Redis 命令参数。
	 *
	 * `redis@5` 的 `sendCommand` 接收字符串或 Buffer，这里将数字参数统一转换成字符串。
	 */
	private normalizeCommand(command: RedisCommand): Array<string | Buffer> {
		return command.map((item) => typeof item == "number" ? String(item) : item);
	}
}
