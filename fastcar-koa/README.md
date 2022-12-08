# 基于封装koa的web成型框架

## 快速安装

npm install fastcar@koa

## 基本原理

* 采用@fastcar/core框架，然后将koa包装成一个基础组件进行调用
* 加载顺序为优先加载自定义中间件->加载自定义路由->启动http服务进行监听
* 停止阶段 延迟一秒左右 将server进行关闭

## 如何使用

```ts
import { FastCarApplication } from "@fastcar/core";
import { Application } from "@fastcar/core/annotation";
import { EnableKoa } from "@fastcar/koa/annotation";

@Application //注入基础框架
@EnableKoa //开启koa
class APP {
 app!: FastCarApplication;
}

export const app = new APP();
```

## 添加一个路由访问

```ts
import { Controller } from "@fastcar/core/annotation";
import { GET } from "@fastcar/koa/annotation";

@Controller
export default class HelloController {

 @GET("/")
 home() {
  return "hello world";
 }
}
```

## 如何引用koa中间件

```ts
//自定义中间件
//默认会出传入 app: FastCarApplication 可供选择
function Example(): koa.Middleware {
    return async (ctx: koa.Context, next: Function) => {
        console.log("example--- in");
        await next();
        console.log("example--- out");
    };
}

//在主入口内添加
import { FastCarApplication } from "@fastcar/core";
import { Application } from "@fastcar/core/annotation";
import { EnableKoa } from "@fastcar/koa/annotation";

@Application //注入基础框架
@EnableKoa //开启koa
@KoaMiddleware(Example)
class APP {
 app!: FastCarApplication;
}

export const app = new APP();
```

## 默认整合的koa中间件(开启方式为@KoaMiddleware(XX))

* ExceptionGlobalHandler 用于koa运行时的异常情况捕捉
* KoaBody 用于文件上传 与 koa-body的用法一致
* KoaBodyParser 用于请求数据的解析 推荐客户端使用application/json的方式
* KoaCors 跨域设置(后期可能会用更好的插件替代)
* KoaStatic 整合了koa-static,koa-range,koa-mount用于静态文件访问,可设置别名
* Swagger 用于展示api文档使用(后期支持自动化配置说明)

## 注解说明

* EnableKoa 作用于应用 开启Koa组件

* AllMapping,ALL 作用于controller层 支持GET POST等请求方式访问

* GetMapping GET

* PostMapping POST

* DeleteMapping DELETE

* PatchMapping PATCH

* PutMapping PUT

* RequestMapping REQUEST 作用于头部，用于追加url

* KoaMiddleware 作用于应用 用于加载中间件 越在应用上面 优先级越高

## 更多用法

参考项目git地址 @fastcar/koa/test下的simple内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
