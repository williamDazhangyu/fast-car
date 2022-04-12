# fastcar-core框架下整合的rpc框架

## 快速安装

npm install fastcar-rpc

## 框架说明

* 参考koa框架，结合koa-compose的思想，制定了一套rpc基本的通信规则
* 顶层主要是RpcServer和RpcClient两个类的封装，其中RpcSevrer整合成了一个组件，直接在入口处配置即可
* 消息通信采用长连接，一般按规定抽象成SocketServer和SocketClient，再由底层进行实现

## 框架类型支持

* 从第三方依赖库上来说支持socket.io,mqtt和ws三种
* 从长连接通讯协议来说支持ws,wss,mqtt,mqtts等

## 第三方依赖包安装

* 使用socket.io时,安装 socket.io 和 socket.io-client

* 使用mqtt时,安装 aedes 和 mqtt，如果要支持ws协议还需要装websocket-stream

* 使用ws时，安装 ws

## 消息通信配置说明

```ts
//服务端配置
type RpcConfig = {
 list: SocketServerConfig[];
 retry: {
  retryCount: number; //错误重试次数 默认三次
  retryInterval: number; //重试间隔 默认一秒
  maxMsgNum: number; //最大并发数
  timeout: number; //超时时间
 };
};

//客户端配置
type RpcClientConfig = {
 retryCount: number; //错误重试次数 默认三次
 retryInterval: number; //重试间隔 默认一秒
 maxMsgNum: number; //最大并发数
 timeout: number; //超时时间
} & SocketClientConfig;
```

```ts
//服务端连接配置
 type SocketServerConfig = {
 id: string; //编号名称
 type: SocketEnum; //具体为哪一种型号的连接器
 server: ServerConfig; //这边和fastcar-server的配置一致
 extra?: any; //第三方拓展配置 用于灵活的调用第三方
 serviceType: string; //服务器用途类型 用于表名是何种服务器
 encode?: EncodeMsg; //编码解码
 decode?: DecodeMsg;
 secure?: SecureClientOptions;
} & { [key: string]: any };

//长连接配置
 type SocketClientConfig = {
 url: string; //连接地址
 type: SocketEnum; //具体为哪一种型号的连接器
 extra?: any; //第三方拓展参数
 encode?: EncodeMsg; //解码器
 decode?: DecodeMsg;
 disconnectInterval?: number;
 secure?: SecureClientOptions;
} & { [key: string]: any };
```

```yml
application:
    name: "simple"
settings:
    rpc:
        list:
            - {
                  id: "rpc-server-1",
                  type: "socket.io",
                  server: { port: 1235 },
                  extra: {},
                  serviceType: "rpc",
              }
            - {
                  id: "rpc-server-2",
                  type: "mqtt",
                  server: { port: 1236, protocol: "net" },
                  extra: {},
                  serviceType: "rpc", #如果是ws则协议连接为http
              }
            - {
                  id: "rpc-server-3",
                  type: "socket.io",
                  server: { port: 1237 },
                  extra: {},
                  serviceType: "rpc",
                  secure: { username: "user", password: "123456" }, #连接前进行校验
              }
            - {
                  id: "rpc-server-4",
                  type: "ws",
                  server: { port: 1238 },
                  serviceType: "rpc",
                  secure: { username: "user", password: "123456" }, #连接前进行校验
              }
            - {
                  id: "rpc-server-5",
                  type: "mqtt",
                  server:
                      {
                          port: 1239,
                          protocol: "https",
                          ssl:
                              {
                                  key: "./ssl/localhost-key.pem",
                                  cert: "./ssl/localhost-cert.crt",
                              },
                      },
                  serviceType: "rpc",
              }
```

## 消息使用示例说明

```ts
//客户端测试
class NotifyHandle implements RpcAsyncService {
 async handleMsg(url: string, data: Object): Promise<void | Object> {
  console.log("收到服务端消息", url, data);
  return {
   url,
   data: "来自客户端的消息---",
  };
 }
}

@Application
@BasePath(__dirname)
@BaseFilePath(__filename)
@EnableRPC
class APP {
 app!: FastCarApplication;
}
const appInstance = new APP();

describe("rpc交互测试", () => {
 it("服务端和客户端交互", async () => {
  let client1 = new RpcClient(
   {
    // url: "ws://localhost:1235",
    // type: SocketEnum.SocketIO,
    // url: "mqtt://localhost:1236",
    // type: SocketEnum.MQTT,
    url: "ws://localhost:1238",
    type: SocketEnum.WS,
    secure: { username: "user", password: "123456" },
   },
   new NotifyHandle()
  );
  await client1.start();
  let result = await client1.request("/hello");
  console.log("普通调用", result);
  let result2 = await client1.request("/head/hello");
  console.log("追加了head的url", result2);
  let sessionId = client1.getSessionId();
  let server: RpcServer = appInstance.app.getComponentByTarget(RpcServer);
  let result3 = await server.request(sessionId, "/server/test", "发送至客户端");
  console.log("服务端收到客户端应答", result3);
  let result4 = await client1.request("/asynchello");
  console.log("普通调用", result4);
 });

 it("客户端主动断开连接", async () => {
  let client2 = new RpcClient(
   {
    // url: "ws://localhost:1235",
    // type: SocketEnum.SocketIO,
    url: "mqtt://localhost:1236",
    type: SocketEnum.MQTT,
   },
   new NotifyHandle()
  );
  await client2.start();
  client2.stop("客户端主动关闭");
 });
 it("服务端主动断开客户端连接", async () => {
  let client3 = new RpcClient(
   {
    // url: "ws://localhost:1235",
    // type: SocketEnum.SocketIO,
    url: "mqtt://localhost:1236",
    type: SocketEnum.MQTT,
   },
   new NotifyHandle()
  );
  await client3.start();
  let sessionId = client3.getSessionId();
  let server: RpcServer = appInstance.app.getComponentByTarget(RpcServer);
  server.kickSessionId(sessionId, "服务端强制客户端下线");
 });


 it("服务端断线重连", async () => {
  let client4 = new RpcClient(
   {
    // url: "ws://localhost:1235",
    // type: SocketEnum.SocketIO,
    url: "mqtt://localhost:1236",
    type: SocketEnum.MQTT,
    retryCount: 3, //错误重试次数 默认三次
    retryInterval: 100, //重试间隔 默认一秒
    maxMsgNum: 10000, //最大消息并发数
    timeout: 3000,
    disconnectInterval: 1000,
   },
   new NotifyHandle()
  );
  await client4.start();
  let server: RpcServer = appInstance.app.getComponentByTarget(RpcServer);
  await server.stop();
  setTimeout(() => {
   server.start();
  }, 2000);
  // setTimeout(async () => {
  //  try {
  //   let result = await client4.request("/hello");
  //   console.log(result);
  //  } catch (e) {
  //   console.log(e);
  //  }
  // }, 2000);
 });

 it("连接认证测试", async () => {
  let client1 = new RpcClient(
   {
    url: "ws://localhost:1237",
    type: SocketEnum.SocketIO,
    retryCount: 3, //错误重试次数 默认三次
    retryInterval: 100, //重试间隔 默认一秒
    maxMsgNum: 10000, //最大消息并发数
    timeout: 3000,
    disconnectInterval: 1000,
   },
   new NotifyHandle()
  );
  let connect1 = await client1.start();
  console.assert(connect1 == true);
  if (!connect1) {
   client1.close();
  }
  let client2 = new RpcClient(
   {
    url: "ws://localhost:1237",
    type: SocketEnum.SocketIO,
    retryCount: 3, //错误重试次数 默认三次
    retryInterval: 100, //重试间隔 默认一秒
    maxMsgNum: 10000, //最大消息并发数
    timeout: 3000,
    disconnectInterval: 1000,
    secure: {
     username: "user",
     password: "123456",
    },
   },
   new NotifyHandle()
  );
  let connect2 = await client2.start();
  console.assert(connect2 == true);
 });

 it("ssl 测试", async () => {
  let client1 = new RpcClient(
   {
    url: "wss://localhost:1239",
    type: SocketEnum.MQTT,
    extra: {
     rejectUnauthorized: false, //当没有证书时这边设置为忽略
    },
   },
   new NotifyHandle()
  );
  await client1.start();
  let result = await client1.request("/hello");
  console.log("普通调用", result);
 });
});

```

## 常用功能集成说明

* 会话的连接告知默认路由 /connect

* 会话的离线默认路由 /disconnect

```ts
//示例
@Controller
export default class HelloController {
 @Autowired
 private rpcServer!: RpcServer;

 @RPCMethod()
 connect(session: ClientSession) {
  console.log("connect-----", session.sessionId);
  // //也可以这这里做一些权限校验的工作 如果不对则直接ko
  // this.rpcServer.kickSessionId(session.sessionId, "强制下线");
  return {
   code: 200,
   data: "socket is connect",
  };
 }

 @RPCMethod()
 disconnect({ session, reason }: DisconnectType) {
  console.log("disconnect-----", session.sessionId, reason);
  return {
   code: 200,
  };
 }
}
```

* 连接前进行验证

```ts
//连接前的验证语法 实现接口
@RPCAuth
class Auth implements RpcAuthService {
 async auth(username: string, password: string, config: SocketServerConfig): Promise<boolean> {
  return config.secure?.username == username && config.secure.password == password;
 }
}
```

* 消息重试次数和超时交由客户端进行管理，只需在配置中声明即可

* 业务逻辑为统一的session 具有唯一的sessionId

```ts
//客户端会话值
type ClientSession = {
 sessionId: string;
 serverId: string;
 connectedTime: number; //连接的开始时间
 settings: Map<string | symbol, any>; //自定义设置项
};
```

* 提供给客户端路由

```ts
@Controller
export default class HelloController {
  @RPCMethod() 
  hello() {
    return {
    code: 200,
    data: "我是一个快乐的rpc",
    };
  }

  @RPCMethod()
  async asynchello() { // 访问路径 /asynchello
    return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
      code: 200,
      data: "这是一个异步rpc",
      });
    }, 200);
    });
  }
}

@Controller
@RPC("/head")
export default class HeadController {
  @RPCMethod()
  hello() {
    return {
    code: 200,
    data: "追加了头的url",
    };
  }
}
```

## 注解说明

* EnableRPC 开启rpc服务

* RPC 路由头新增

* RPCMethod 绑定路由方法

* RPCMiddleware 增加链路的中间件

* RPCAuth 强化初始连接是进行用户名和密码的拓展校验

* RPCError 封装原有的响应和捕捉错误

## 更多用法

参考项目git地址 fastcar-rpc/test 下的example内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>

* 备用连接查看 <https://william_zhong.coding.net/public/fast-car/fast-car/git/files>
