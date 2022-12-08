# @fastcar/core框架下的redis使用

## 快速安装

npm install @fastcar/redis

## 使用过程

* 在应用(application)配置下使用 可配置多个 source为自定义数据源名称
* settings:
        redis:
            - { source: "default", host: "localhost", port: 6379, password: "123456" }

* 应用入口开启

```ts
import { EnableRedis } from "@fastcar/redis/annotation";

@Application
@EnableRedis  //开启redis
class APP {
 app!: FastCarApplication;
}

export default = new APP();
```

* 声明redis模板

```ts
import { Repository, DS } from "@fastcar/core/annotation";
import { RedisTemplate } from "@fastcar/redis";

//声明为redis操作模板
@Repository //标注为数据依赖
@DS("default") //这边指定数据源名称和配置内一致
export default class TestRedisTemplate extends RedisTemplate {}
```

* 调用方法

```ts
import { Service } from "@fastcar/core/annotation";
import { Autowired } from "@fastcar/core/annotation";
import TestRedisTemplate from "./TestRedisTemplate";

@Service
export default class SimpleService {

 @Autowired
 private redisTemplate!: TestRedisTemplate;

 async setHello() {
  await this.redisTemplate.set("hello", "world");
 }

 async getHello() {
  return await this.redisTemplate.get("hello");
 }
}
```

## 注解说明

EnableRedis 作用于应用上 用于开启redis组件

## 更多用法

参考项目git地址 @fastcar/redis/test 下的example内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
