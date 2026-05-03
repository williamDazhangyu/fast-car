# @fastcar/redis

`@fastcar/redis` 是 `@fastcar/core` 框架下的 Redis 组件，基于 `redis@5`，提供多数据源、常用缓存操作、Redis 数据结构操作以及 pipeline、transaction、pub/sub、Lua 等高级能力。

## 安装

```bash
npm install @fastcar/redis
```

## 版本要求

* Node.js >= 20
* redis npm package >= 5
* @fastcar/core >= 0.3.20

## 配置

在应用的 `resource/application.yml` 中配置 Redis 数据源。`source` 是数据源名称，默认模板方法会使用 `default`。

兼容旧版扁平配置：

```yaml
application:
  name: "simple"
settings:
  redis:
    - { source: "default", host: "localhost", port: 6379, password: "123456" }
```

也支持 `redis@5` 的 `socket` 配置：

```yaml
settings:
  redis:
    - source: "default"
      password: "123456"
      socket:
        host: "localhost"
        port: 6379
```

如果本地 Redis 没有密码，不要配置 `password`。

## 启用组件

```ts
import { FastCarApplication } from "@fastcar/core";
import { Application } from "@fastcar/core/annotation";
import { EnableRedis } from "@fastcar/redis/annotation";

@Application
@EnableRedis
class APP {
  app!: FastCarApplication;
}

new APP();
```

## 声明 RedisTemplate

```ts
import { Repository, DS } from "@fastcar/core/annotation";
import { RedisTemplate } from "@fastcar/redis";

@Repository
@DS("default")
export default class TestRedisTemplate extends RedisTemplate {}
```

## 基础使用

```ts
import { Service, Autowired } from "@fastcar/core/annotation";
import TestRedisTemplate from "./TestRedisTemplate";

@Service
export default class SimpleService {
  @Autowired
  private redisTemplate!: TestRedisTemplate;

  async setHello() {
    await this.redisTemplate.set("hello", "world");
  }

  async getHello() {
    return this.redisTemplate.get("hello");
  }
}
```

## 常用 API

### String / Cache

| 方法 | 说明 |
| --- | --- |
| `set(key, value, source?)` | 设置字符串或对象值，对象会自动 `JSON.stringify` |
| `get(key, source?)` | 获取字符串值 |
| `setEx(key, value, seconds, source?)` | 设置值并设置过期时间 |
| `setExpire(key, value, seconds, source?)` | `setEx` 的兼容旧名 |
| `setNx(key, value, seconds?, source?)` | key 不存在时才设置，可选过期时间 |
| `setJson(key, value, seconds?, source?)` | 设置 JSON 对象 |
| `getJson<T>(key, source?)` | 获取并解析 JSON |
| `mSet(values, source?)` | 批量设置 |
| `mGet(keys, source?)` | 批量获取 |
| `incr(key, source?)` / `decr(key, source?)` | 自增 / 自减 |
| `incrKey(key, source?)` / `decrKey(key, source?)` | 兼容旧名 |

```ts
await redisTemplate.setEx("token:1", { id: 1 }, 3600);
const token = await redisTemplate.getJson<{ id: number }>("token:1");

const ok = await redisTemplate.setNx("lock:job", "1", 30);
```

### Key / TTL

| 方法 | 说明 |
| --- | --- |
| `exists(key, source?)` | 判断 key 是否存在 |
| `existKey(key, source?)` | 兼容旧名 |
| `del(keys, source?)` | 删除多个 key，返回删除数量 |
| `delKey(key, source?)` | 删除单个 key，返回 boolean |
| `delKeys(pattern, source?)` | 使用 `SCAN + DEL` 按 pattern 批量删除 |
| `expire(key, seconds, source?)` | 设置过期时间 |
| `ttl(key, source?)` | 获取剩余过期时间 |
| `persist(key, source?)` | 移除过期时间 |
| `rename(key, newKey, source?)` | 重命名 key |
| `type(key, source?)` | 获取 key 类型 |
| `keys(pattern, source?)` | 使用 `KEYS` 获取 key |
| `getBulkKey(pattern, source?)` | `keys` 的兼容旧名 |
| `scan(pattern?, count?, source?)` | 使用 `SCAN` 获取 key |

生产环境批量匹配 key 时优先使用 `scan` 或 `delKeys`，避免直接使用 `KEYS` 扫描大 key 空间。

### Hash

| 方法 | 说明 |
| --- | --- |
| `hSet(key, field, value, source?)` | 设置 hash 字段 |
| `hGet(key, field, source?)` | 获取 hash 字段 |
| `hGetAll(key, source?)` | 获取整个 hash |
| `hDel(key, fields, source?)` | 删除字段 |
| `hExists(key, field, source?)` | 判断字段是否存在 |
| `hIncrBy(key, field, increment, source?)` | 字段自增 |

### List

| 方法 | 说明 |
| --- | --- |
| `lPush(key, values, source?)` | 从左侧推入 |
| `rPush(key, values, source?)` | 从右侧推入 |
| `lPop(key, source?)` | 从左侧弹出 |
| `rPop(key, source?)` | 从右侧弹出 |
| `lRange(key, start, stop, source?)` | 获取范围 |
| `lLen(key, source?)` | 获取长度 |

### Set

| 方法 | 说明 |
| --- | --- |
| `sAdd(key, members, source?)` | 添加成员 |
| `sRem(key, members, source?)` | 删除成员 |
| `sMembers(key, source?)` | 获取所有成员 |
| `sIsMember(key, member, source?)` | 判断成员是否存在 |
| `sCard(key, source?)` | 获取成员数量 |

### ZSet

| 方法 | 说明 |
| --- | --- |
| `zAdd(key, score, member, source?)` | 添加成员 |
| `zRem(key, members, source?)` | 删除成员 |
| `zRange(key, start, stop, source?)` | 正序获取 |
| `zRevRange(key, start, stop, source?)` | 倒序获取 |
| `zRangeWithScores(key, start, stop, source?)` | 正序获取并返回 score |
| `zScore(key, member, source?)` | 获取成员分数 |

## RedisTemplate 方法示例说明

下面示例假设已经在业务类中注入了 `redisTemplate`。所有方法最后一个参数都可以传入 `source` 指定 Redis 数据源，例如 `await redisTemplate.get("user:1", "default")`。

### 字符串与缓存

字符串方法适合保存普通缓存、JSON 对象、计数器、短期 token 和简单分布式锁。

```ts
// 设置普通字符串，底层执行 SET。
await redisTemplate.set("cache:name", "fastcar");

// 设置对象时会自动 JSON.stringify，读取时可以用 getJson 解析。
await redisTemplate.setJson("user:1", { id: 1, name: "Tom" }, 3600);
const user = await redisTemplate.getJson<{ id: number; name: string }>("user:1");

// 设置带过期时间的缓存，单位是秒。
await redisTemplate.setEx("token:1", "token-value", 1800);
const ttl = await redisTemplate.ttl("token:1");

// key 不存在时才设置，常用于锁或幂等控制。
const locked = await redisTemplate.setNx("lock:order:1", "1", 30);
if (locked) {
  try {
    // 执行业务逻辑
  } finally {
    await redisTemplate.delKey("lock:order:1");
  }
}

// 批量设置和批量读取。
await redisTemplate.mSet({
  "profile:1": { id: 1 },
  "profile:2": { id: 2 },
});
const profiles = await redisTemplate.mGet(["profile:1", "profile:2"]);

// 计数器自增 / 自减。
const views = await redisTemplate.incr("article:1:views");
const remaining = await redisTemplate.decr("stock:sku:1");
```

### Key 与过期时间

Key 方法适合判断缓存是否存在、管理 TTL、批量扫描和清理缓存。

```ts
const exists = await redisTemplate.exists("user:1");

await redisTemplate.expire("user:1", 600);
const seconds = await redisTemplate.ttl("user:1");

// 移除过期时间，让 key 变成永久 key。
await redisTemplate.persist("user:1");

// 重命名 key，目标 key 已存在时会被 Redis 覆盖。
await redisTemplate.rename("user:1", "user:10001");

// 获取 key 的 Redis 类型，例如 string、hash、list、set、zset、none。
const type = await redisTemplate.type("user:10001");

// 生产环境建议使用 scan，而不是 keys。
const keys = await redisTemplate.scan("user:*", 100);
const deletedCount = await redisTemplate.delKeys("temp:*");
```

### Hash

Hash 适合保存对象的多个字段，例如用户信息、配置项、统计字段。

```ts
await redisTemplate.hSet("user:1:info", "name", "Tom");
await redisTemplate.hSet("user:1:info", "age", 18);

const name = await redisTemplate.hGet("user:1:info", "name");
const info = await redisTemplate.hGetAll("user:1:info");

const hasAge = await redisTemplate.hExists("user:1:info", "age");
const loginCount = await redisTemplate.hIncrBy("user:1:info", "loginCount", 1);

await redisTemplate.hDel("user:1:info", ["age"]);
```

### List

List 适合简单队列、消息列表、最近访问记录等按顺序存取的场景。

```ts
// 从右侧入队，从左侧出队，可以实现 FIFO 队列。
await redisTemplate.rPush("queue:email", ["job-1", "job-2"]);
const job = await redisTemplate.lPop("queue:email");

// 从左侧推入，读取前 10 条，适合最近记录。
await redisTemplate.lPush("recent:user:1", ["page:home"]);
const recentPages = await redisTemplate.lRange("recent:user:1", 0, 9);
const length = await redisTemplate.lLen("recent:user:1");

// 也可以从右侧弹出。
const last = await redisTemplate.rPop("recent:user:1");
```

### Set

Set 适合去重集合、标签、用户分组、权限集合等不需要顺序的场景。

```ts
await redisTemplate.sAdd("article:1:tags", ["redis", "cache", "nodejs"]);

const tags = await redisTemplate.sMembers("article:1:tags");
const hasRedis = await redisTemplate.sIsMember("article:1:tags", "redis");
const tagCount = await redisTemplate.sCard("article:1:tags");

await redisTemplate.sRem("article:1:tags", ["nodejs"]);
```

### ZSet

ZSet 适合排行榜、带权重排序、延迟任务时间戳排序等场景。

```ts
await redisTemplate.zAdd("rank:score", 100, "user:1");
await redisTemplate.zAdd("rank:score", 88, "user:2");

// 正序和倒序获取成员。
const asc = await redisTemplate.zRange("rank:score", 0, -1);
const desc = await redisTemplate.zRevRange("rank:score", 0, 9);

// 同时获取成员和分数。
const rank = await redisTemplate.zRangeWithScores("rank:score", 0, -1);
const score = await redisTemplate.zScore("rank:score", "user:1");

await redisTemplate.zRem("rank:score", ["user:2"]);
```

### Pipeline、Transaction、Pub/Sub、Lua 与原始命令

高级方法适合减少网络往返、批量原子提交、频道消息通知、自定义 Lua 逻辑和调用未封装 Redis 命令。

```ts
// Pipeline：批量发送命令，减少网络往返，但不保证事务原子性。
const pipelineResult = await redisTemplate.pipeline([
  ["SET", "pipeline:key", "ok"],
  ["GET", "pipeline:key"],
]);

// Transaction：使用 MULTI/EXEC 提交事务。
const transactionResult = await redisTemplate.transaction([
  ["SET", "tx:key", "ok"],
  ["INCR", "tx:count"],
]);

// Pub/Sub：subscribe 会返回取消订阅函数，记得在不需要时调用。
const unsubscribe = await redisTemplate.subscribe("notice", async (message, channel) => {
  console.log(channel, message);
});
await redisTemplate.publish("notice", { type: "created", id: 1 });
await unsubscribe();

// Pattern 订阅可以匹配多个频道。
const pUnsubscribe = await redisTemplate.pSubscribe("notice:*", (message, channel) => {
  console.log(channel, message);
});
await pUnsubscribe();

// Lua：keys 会映射到 KEYS，args 会映射到 ARGV。
const luaResult = await redisTemplate.eval(
  "return redis.call('GET', KEYS[1]) or ARGV[1]",
  ["missing:key"],
  ["default-value"]
);

// 原始命令：用于调用 RedisTemplate 暂未封装的命令。
const pong = await redisTemplate.rawCommand<string>(["PING"]);
```

## 高级能力

### Pipeline / Transaction

```ts
const pipelineResult = await redisTemplate.pipeline([
  ["SET", "pipeline:key", "ok"],
  ["GET", "pipeline:key"],
]);

const transactionResult = await redisTemplate.transaction([
  ["SET", "transaction:key", "ok"],
  ["GET", "transaction:key"],
]);
```

### Pub/Sub

订阅会创建独立 Redis 连接，返回的函数用于取消订阅并关闭连接。

```ts
const unsubscribe = await redisTemplate.subscribe("notice", (message, channel) => {
  console.log(channel, message);
});

await redisTemplate.publish("notice", "hello");
await unsubscribe();
```

也支持 pattern 订阅：

```ts
const unsubscribe = await redisTemplate.pSubscribe("notice:*", (message, channel) => {
  console.log(channel, message);
});
```

### Lua / Raw Command

```ts
const result = await redisTemplate.eval("return ARGV[1]", [], ["hello"]);
const shaResult = await redisTemplate.evalSha("script-sha", ["key1"], ["arg1"]);

const raw = await redisTemplate.rawCommand(["PING"]);
```

`execLua(luaStr, keysLength, param, source?)` 保留为兼容旧版本的 Lua 方法；新代码建议使用 `eval` / `evalSha`。

## 多数据源

所有模板方法最后一个参数都支持 `source?: string`，用于指定数据源。通常配合 `@DS("sourceName")` 使用；特殊场景也可以在调用时显式传入。

```ts
await redisTemplate.set("hello", "world", "default");
```

## 测试示例

项目内置示例位于 `fastcar-redis/test/example`，可直接运行：

```bash
npx ts-node -r tsconfig-paths/register test/example/app.ts
```

示例覆盖 String、Hash、List、Set、ZSet、SCAN、Lua、Pipeline、Transaction、Pub/Sub 等能力。

## 开源地址

* GitHub: <https://github.com/williamDazhangyu/fast-car>
