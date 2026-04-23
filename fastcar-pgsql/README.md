# @fastcar/pgsql

FastCar 的 PostgreSQL 组件，提供连接池、ORM 映射、事务管理、多数据源、原生 SQL 执行，以及基于 `pgvector` 的向量检索能力。

## 功能概览

- 基于 `pg` 的 PostgreSQL 连接池管理
- 基于装饰器的实体映射与 CRUD 操作
- 声明式事务和编程式事务
- 多数据源支持
- 条件查询、排序、分页、聚合、连接查询
- 原生 SQL 与自定义查询结果映射
- `pgvector` 向量存储、相似度查询、向量索引
- 从数据库表反向生成 Model 和 Mapper

## 安装

```bash
npm install @fastcar/pgsql
```

或

```bash
yarn add @fastcar/pgsql
```

### 国内网络建议

如果默认 npm 源较慢，可以切换到国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

如果需要下载 `pgvector` 源码而 GitHub 无法访问，可以使用国内镜像：

```bash
git clone --depth 1 https://gitcode.com/GitHub_Trending/pg/pgvector.git
```

## 依赖

- `@fastcar/core`
- `@fastcar/timer`
- `pg`

## 快速开始

### 1. 配置数据源

在 `application.yml` 中添加 PostgreSQL 配置：

```yaml
pgsql:
  dataSoucreConfig:
    - source: master
      host: localhost
      port: 5432
      database: mydb
      user: postgres
      password: secret
      default: true
      writeDefault: true
      readDefault: true
      max: 20
      idleTimeoutMillis: 30000
  printSQL: true
  slowSQLInterval: 500
  sessionTimeOut: 5000
```

### 2. 启用组件

```ts
import { FastCarApplication } from "@fastcar/core";
import { Application, BaseFilePath, BasePath } from "@fastcar/core/annotation";
import EnablePgsql from "@fastcar/pgsql/annotation";

@Application
@BasePath(__dirname)
@BaseFilePath(__filename)
@EnablePgsql
class App {
  app!: FastCarApplication;
}

const app = new App();
```

### 3. 定义实体

```ts
import { Table, Field, DBType, PrimaryKey, NotNull, IsSerial } from "@fastcar/core/annotation";

@Table("users")
class User {
  @Field("id")
  @DBType("bigint")
  @PrimaryKey
  @NotNull
  @IsSerial
  id!: number;

  @Field("username")
  @DBType("varchar")
  username!: string;

  @Field("email")
  @DBType("varchar")
  email!: string;

  @Field("created_at")
  @DBType("timestamp")
  createdAt!: Date;

  @Field("metadata")
  @DBType("jsonb")
  metadata!: any;

  constructor(args?: Partial<User>) {
    if (args) {
      Object.assign(this, args);
    }
  }
}
```

### 4. 定义 Mapper

```ts
import { Entity, Repository } from "@fastcar/core/annotation";
import { PgsqlMapper } from "@fastcar/pgsql";
import User from "../model/User";

@Entity(User)
@Repository
class UserMapper extends PgsqlMapper<User> {}

export default UserMapper;
```

### 5. 在 Service 中使用

```ts
import { Autowired, Service } from "@fastcar/core/annotation";
import UserMapper from "../mapper/UserMapper";
import User from "../model/User";

@Service
class UserService {
  @Autowired
  private userMapper!: UserMapper;

  async createUser(username: string, email: string): Promise<number> {
    const user = new User({
      username,
      email,
      createdAt: new Date(),
      metadata: {},
    });

    return await this.userMapper.saveOne(user);
  }

  async findById(id: number): Promise<User | null> {
    return await this.userMapper.selectByPrimaryKey(new User({ id }));
  }

  async findByUsername(username: string): Promise<User[]> {
    return await this.userMapper.select({
      where: { username },
      orders: { createdAt: "DESC" },
    });
  }

  async updateEmail(id: number, email: string): Promise<boolean> {
    return await this.userMapper.update({
      row: { email },
      where: { id },
    });
  }

  async deleteUser(id: number): Promise<boolean> {
    return await this.userMapper.deleteByPrimaryKey(new User({ id }));
  }
}
```

## 常用操作

### CRUD

```ts
const id = await mapper.saveOne(entity);

await mapper.saveList([entity1, entity2]);

await mapper.saveORUpdate(entity);

const rows = await mapper.select({
  where: { status: "active" },
  fields: ["id", "username"],
  orders: { createdAt: "DESC" },
  limit: 10,
  offest: 0,
});

const row = await mapper.selectOne({ where: { id: 1 } });

const byPk = await mapper.selectByPrimaryKey(new User({ id: 1 }));

await mapper.update({
  row: { username: "newName" },
  where: { id: 1 },
});

await mapper.updateByPrimaryKey(entity);

await mapper.delete({ where: { status: "inactive" } });

await mapper.deleteByPrimaryKey(new User({ id: 1 }));

const count = await mapper.count({ status: "active" });

const exists = await mapper.exist({ id: 1 });
```

### 条件查询

```ts
await mapper.select({
  where: {
    age: { ">=": 18, "<=": 60 },
    name: { like: "%John%" },
    status: { in: ["active", "pending"] },
    email: { isNotNull: null },
    deleted_at: { isNUll: null },
  },
});

await mapper.select({
  where: {
    OR: [{ username: "john" }, { email: "john@example.com" }],
  },
});

await mapper.select({
  where: {
    AND: [{ status: "active" }, { OR: [{ age: { "<": 18 } }, { age: { ">": 60 } }] }],
  },
});
```

### 原生 SQL

```ts
const result = await mapper.execute(
  "SELECT * FROM users WHERE age > ? AND status = ?",
  [18, "active"]
);

const rows = await mapper.query(
  "SELECT count(*) as total FROM orders WHERE created_at > ?",
  [new Date("2024-01-01")]
);
```

## 事务

### 声明式事务

```ts
import { Autowired, Service, Transactional } from "@fastcar/core/annotation";

@Service
class OrderService {
  @Autowired
  private orderMapper!: OrderMapper;

  @Autowired
  private inventoryMapper!: InventoryMapper;

  @Transactional
  async createOrder(order: Order): Promise<boolean> {
    await this.orderMapper.saveOne(order);
    await this.inventoryMapper.decrease(order.productId, order.quantity);
    return true;
  }
}
```

### 编程式事务

```ts
import { Autowired, Service } from "@fastcar/core/annotation";
import { PgsqlDataSourceManager } from "@fastcar/pgsql";

@Service
class OrderService {
  @Autowired
  private dsm!: PgsqlDataSourceManager;

  @Autowired
  private orderMapper!: OrderMapper;

  @Autowired
  private inventoryMapper!: InventoryMapper;

  async createOrder(order: Order): Promise<boolean> {
    const sessionId = this.dsm.createSession();

    try {
      await this.orderMapper.saveOne(order, undefined, sessionId);
      await this.inventoryMapper.decrease(order.productId, order.quantity, undefined, sessionId);
      await this.dsm.destorySession(sessionId, false);
      return true;
    } catch (e) {
      await this.dsm.destorySession(sessionId, true);
      throw e;
    }
  }
}
```

## 多数据源

```yaml
pgsql:
  dataSoucreConfig:
    - source: master
      host: master.db.host
      port: 5432
      database: mydb
      user: postgres
      password: secret
      writeDefault: true
    - source: slave
      host: slave.db.host
      port: 5432
      database: mydb
      user: postgres
      password: secret
      readDefault: true
```

```ts
await mapper.select({ where: { id: 1 } }, "slave");
await mapper.saveOne(entity, "master");
```

## pgvector 向量功能

### 1. 安装扩展

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. 定义向量字段

建议显式声明维度，例如 `vector(3)`：

```ts
import { DBType, Field, IsSerial, PrimaryKey, Table } from "@fastcar/core/annotation";

@Table("documents")
class Document {
  @Field("id")
  @DBType("bigint")
  @PrimaryKey
  @IsSerial
  id!: number;

  @Field("content")
  @DBType("text")
  content!: string;

  @Field("embedding")
  @DBType("vector(3)")
  embedding!: Float32Array | number[];
}
```

### 3. 插入向量

`embedding` 同时支持 `number[]` 和 `Float32Array`：

```ts
await mapper.saveOne(
  new Document({
    content: "hello",
    embedding: [1, 2, 3],
  })
);

await mapper.saveOne(
  new Document({
    content: "world",
    embedding: new Float32Array([1, 2, 3]),
  })
);
```

### 4. 相似度查询

```ts
import { VectorOperatorEnum } from "@fastcar/pgsql";

const results = await mapper.selectByVector({
  field: "embedding",
  vector: [1, 0, 0],
  operator: VectorOperatorEnum.l2Distance,
  limit: 10,
});

const filtered = await mapper.selectByVectorWithWhere(
  {
    field: "embedding",
    vector: [1, 1, 0],
    operator: VectorOperatorEnum.cosineDistance,
    limit: 10,
  },
  { category: "tech" }
);
```

支持的向量操作符：

- `VectorOperatorEnum.l2Distance`
- `VectorOperatorEnum.cosineDistance`
- `VectorOperatorEnum.innerProduct`

### 5. 创建向量索引

```ts
import { VectorIndexType } from "@fastcar/pgsql";

await dsm.enableVectorExtension();

await dsm.createVectorIndex({
  table: "documents",
  column: "embedding",
  type: VectorIndexType.ivfflat,
  opClass: "vector_cosine_ops",
  lists: 100,
});

await dsm.createVectorIndex({
  table: "documents",
  column: "embedding",
  type: VectorIndexType.hnsw,
  m: 16,
  efConstruction: 64,
});
```

### 6. 已完成的真实环境验证

在 `2026-04-23`，已使用本地真实 PostgreSQL 环境完成验证，核心结果如下：

- PostgreSQL 实例真实连接成功
- `vector` 扩展已安装并启用，版本 `0.8.2`
- `test_vector.embedding` 实际类型为 `vector`，不是降级的 `TEXT`
- `number[]` 与 `Float32Array` 插入均通过
- 向量查询 SQL 已按 `?::vector` 正确执行
- 已验证 `L2`、`cosine`、`inner product`
- 已验证 `ivfflat` 和 `hnsw` 索引创建

直接 SQL 验证结果：

- 查询向量 `[1,0,0]` 的 L2 最近邻：`a -> 0`，`c -> 1`，`b -> 1.4142135623730951`
- 查询向量 `[1,1,0]` 的 cosine 最近邻：`c -> 0`，`a/b -> 0.29289321881345254`

## 反向生成

```ts
import { ReverseGenerate } from "@fastcar/pgsql";

await ReverseGenerate.generator({
  tables: ["users", "orders", "products"],
  modelDir: "/path/to/models",
  mapperDir: "/path/to/mappers",
  dbConfig: {
    host: "localhost",
    port: 5432,
    database: "mydb",
    user: "postgres",
    password: "secret",
  },
  ignoreCamelcase: false,
});
```

## API 摘要

### 装饰器

| 装饰器 | 说明 |
| --- | --- |
| `@Table(name)` | 指定表名 |
| `@Field(name)` | 指定字段名 |
| `@DBType(type)` | 指定数据库字段类型 |
| `@PrimaryKey` | 标记主键 |
| `@IsSerial` | 标记自增字段 |
| `@NotNull` | 标记非空 |
| `@Entity(Model)` | 指定 Mapper 对应实体 |
| `@Repository` | 标记数据访问层 |

### PgsqlMapper 常用方法

| 方法 | 说明 |
| --- | --- |
| `saveOne(row, ds?, sessionId?)` | 插入单条记录并返回主键 |
| `saveList(rows, ds?, sessionId?)` | 批量插入 |
| `saveORUpdate(rows, ds?, sessionId?)` | UPSERT |
| `select(conditions, ds?, sessionId?)` | 条件查询 |
| `selectOne(conditions, ds?, sessionId?)` | 查询单条 |
| `selectByPrimaryKey(row, ds?, sessionId?)` | 主键查询 |
| `selectByCustom(conditions, ds?, sessionId?)` | 自定义返回结构查询 |
| `update({ row, where, limit }, ds?, sessionId?)` | 更新记录 |
| `updateOne(sqlUpdate, ds?, sessionId?)` | 更新单条 |
| `updateByPrimaryKey(row, ds?, sessionId?)` | 按主键更新 |
| `delete(conditions, ds?, sessionId?)` | 删除记录 |
| `deleteOne(where, ds?, sessionId?)` | 删除单条 |
| `deleteByPrimaryKey(row, ds?, sessionId?)` | 按主键删除 |
| `count(where, ds?, sessionId?)` | 统计数量 |
| `exist(where, ds?, sessionId?)` | 判断记录是否存在 |
| `execute(sql, args?, ds?, sessionId?)` | 执行自定义 SQL |
| `query(sql, args?, ds?, sessionId?)` | 执行查询 SQL |
| `selectByVector(query, ds?, sessionId?)` | 向量相似度查询 |
| `selectByVectorWithWhere(query, where?, ds?, sessionId?)` | 带过滤条件的向量查询 |

## 类型映射

| PostgreSQL 类型 | TypeScript 类型 |
| --- | --- |
| `integer` `smallint` `bigint` | `number` |
| `decimal` `numeric` `real` `double precision` | `number` |
| `money` `char` `varchar` `text` | `string` |
| `bytea` | `Buffer` |
| `boolean` | `boolean` |
| `timestamp` `timestamptz` | `Date` |
| `json` `jsonb` | `any` |
| `uuid` `inet` `cidr` `macaddr` | `string` |
| `vector` `vector(n)` | `Float32Array` 或 `number[]` |

## 配置说明

### `SqlConfig`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `source` | `string` | 数据源名称 |
| `host` | `string` | 主机地址 |
| `port` | `number` | 端口，默认 `5432` |
| `database` | `string` | 数据库名称 |
| `user` | `string` | 用户名 |
| `password` | `string` | 密码 |
| `max` | `number` | 最大连接数 |
| `idleTimeoutMillis` | `number` | 空闲超时 |
| `connectionTimeoutMillis` | `number` | 连接超时 |
| `default` | `boolean` | 是否默认数据源 |
| `readDefault` | `boolean` | 是否默认读数据源 |
| `writeDefault` | `boolean` | 是否默认写数据源 |

### `PgSqlConfig`

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `dataSoucreConfig` | `SqlConfig[]` | - | 数据源配置列表 |
| `printSQL` | `boolean` | `false` | 是否打印 SQL |
| `slowSQLInterval` | `number` | `500` | 慢 SQL 阈值，单位毫秒 |
| `sessionTimeOut` | `number` | `5000` | 事务会话超时，单位毫秒 |
| `maximumConnectionReleaseTime` | `number` | `10000` | 连接最大释放时间，单位毫秒 |

## 测试

项目内置以下脚本：

```bash
npm run test:unit
npx mocha -r ts-node/register -r tsconfig-paths/register test/integration/PgsqlMapper.vector.test.ts --timeout 30000 --exit
npm run test:integration
npm run test:example
npm run test:system
```

其中：

- `test:unit`：单元测试
- `test:integration`：集成测试
- `test:example`：示例工程测试
- `test:system`：完整系统测试，等价于 `unit + integration + example`

如果要复现仓库中的真实数据库测试，可参考：

- 测试库初始化脚本：`test/test.sql`
- 示例配置：`test/resource/application.yml`

## 注意事项

- PostgreSQL 不支持 MySQL 风格的 `FORCE INDEX`，本组件中该选项会被忽略，不生成非法 SQL。
- 向量字段建议使用 `@DBType("vector(n)")` 显式声明维度。
- 开启 `printSQL: true` 后，可直接在日志中查看最终执行 SQL。
- `test/example` 中包含事务回滚和异常处理用例，日志中出现预期错误并不代表测试失败，应以最终断言结果为准。

## License

MIT
