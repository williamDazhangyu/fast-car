# fastcar-core框架下创建网络服务器

## 快速安装

npm install fastcar-server

## 使用说明

* 由应用手动创建服务，并放置ServerApplication下统一进行管理
* 应用入口开启 @EnableServer
* 新版本的fastcar-koa 和 fastcar-rpc均依赖于server创建服务
* 生命周期，它的周期均为最后 每次启动或者停止均为最后
* 支持创建 net http https http2 ssl服务

## 服务基础配置说明

* port?: number; //可选 默认80 https默认443
* protocol?: Protocol; //可选 http  http2 或者 https 默认http
* ssl?: SSLConfig; //可选 ssl 对象中为cert和key 用于支持ssl请求
* hostname?: string; //可选 当填写0.0.0.0时则不开启ipv6了

```ts
import "reflect-metadata";
import { FastCarApplication } from "fastcar-core";
import { Application, BaseFilePath, BasePath } from "fastcar-core/annotation";
import { EnableServer } from "fastcar-server";

@Application
@BasePath(__dirname)
@BaseFilePath(__filename)
@EnableServer
class APP {
 app!: FastCarApplication;
}
new APP();

```

* 手动调用server示例

```ts
@ApplicationStart(BootPriority.Lowest)
export default class ServerService {
 @Autowired
 protected serverApplication!: ServerApplication;

 @Autowired
 protected app!: FastCarApplication;

 run() {
  let list: ServerConfig[] = this.app.getSetting("server"); //此处为服务器配置列表

  //进行创建
  list.forEach((item) => {
   this.serverApplication.createServer(item, (req: any, res: any) => {
    try {
     if (item.protocol == Protocol.http || item.protocol == Protocol.https || item.protocol == Protocol.http2) {
      res.writeHead(200);
      res.end("hello world\n");
     } else {
      req.end("hello world\n");
     }
    } catch (e) {
     console.error(e);
    }
   });
  });
 }
}
```

* 应用配置示例

```yml
application:
  name: "simple"
settings:
  server:
    - { port: 1234 } ##默认http请求
    - {
        port: 1235,
        protocol: https,
        ssl:
          { key: "./ssl/localhost-key.pem", cert: "./ssl/localhost-cert.crt" },
      }
    - { port: 1236, protocol: net } #创建一个tcp请求
```

## 注解说明

EnableServer 作用于应用上 用于开启server组件

## 更多用法

参考项目git地址 fastcar-server/test 下的example内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
