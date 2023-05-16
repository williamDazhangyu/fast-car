# 内存缓存

## 使用场景

* 提供基础的缓存功能(比如 增删改查和设置缓存失效)

* 用于频繁存储数据 减缓对数据库写操作的压力

* 允许自定义不同的客户端，拓展其数据持久化能力

## 快速安装

npm install @fastcar/cache

## 使用案例

* 开启缓存功能

```ts
@EnableCache
class APP {
 app!: FastCarApplication;
}
```

* 无客户端持久化缓存示例

```ts
import {CacheMapping} from "@fastcar/cache";
//配置操作
@CacheMapping
class NoclientMapping implements CacheConfig {
 store: string = "noclientStore";
 initSync: boolean = false;
}

export default NoclientMapping;
```

```ts
//调用操作
cacheApplication.set("noclientStore", "hello", "world");
let world = cacheApplication.get("noclientStore", "hello");
assert(world == "world");

//设置缓存过期时间
cacheApplication.set("noclientStore", "hellottl", "worldttl", { ttl: 2 }); //2秒后消失
  //两秒判断是否存在key
setTimeout(() => {
    assert(!cacheApplication.has("noclientStore", "hellottl")); //可能会有100ms左右延迟
}, 2200);
```

* 文件客户端缓存示例

```ts
//配置操作
@CacheMapping
export default class FileClientMapping implements CacheConfig {
 store: string = "fileStore";
 initSync: boolean = true;
 syncTimer: number = 5; //5秒钟同步一次
 dbClient: DBClientService<String>;

 constructor() {
  this.dbClient = new FSClient(path.join(__dirname, "../", "filedb", "filedb.json"));
 }
}
```

```ts
 cacheApplication.set("fileStore", "hello", "world", { flush: true }); //立即存储
 cacheApplication.set("fileStore", "hello", "worldss"); //同步后存储
```

* mysql数据库操作示例

```ts
//配置操作
@CacheMapping
export default class MySqlClientMapping implements CacheConfig {
 store: string = "mysqlStore";
 initSync: boolean = true;
 syncTimer: number = 10;
 ttl: number = 20; //60秒后过期
 dbClient: DBClientService<String>;
 dbSync: boolean = false;

 @CallDependency
 private cacheMapper!: CacheMapper;

 constructor() {
  //自定义构造一个存储器
  this.dbClient = {
   mset: async (list: Item<String>[]) => {
    await this.cacheMapper.saveORUpdate(
     list.map((item) => {
      return new CacheModel(Object.assign(item, { updateTime: DateUtil.toDateTime() }));
     })
    );
    return true;
   },
   mget: async (): Promise<Item<String>[]> => {
    let list = await this.cacheMapper.select({});
    return list.map((item) => {
     return {
      key: item.key,
      value: item.value,
      ttl: Math.floor((item.updateTime.getTime() - Date.now()) / 1000),
     };
    });
   },
   mdelete: async (keys: string[]) => {
    await this.cacheMapper.delete({
     where: {
      key: keys,
     },
    });
    return true;
   },
  };
 }
}
```

```ts
  cacheApplication.set("mysqlStore", "hello", "world"); //10s秒存储 60秒后进行删除
```

## 缺陷

* 在项目中限定了每100ms扫描计划操作一次，所以当设置立即存储时 仍然有100ms左右的延迟

* 设置ttl后，数据库客户端的数据，如果程序重启了，则需要重新计算一次ttl时效性

* 不支持分布式缓存，如果需要实现分布式，请确保路由到每个服务时需满足一致性hash规则

## 更多用法

参考项目git地址 @fastcar/cache/test 下的simple内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
