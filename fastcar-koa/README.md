# @fastcar/koa

基于 [@fastcar/core](https://github.com/williamDazhangyu/fast-car) 框架的 Koa Web 服务封装组件，提供装饰器驱动的路由定义和中间件管理。

## 目录

- [特性](#特性)
- [安装](#安装)
- [快速开始](#快速开始)
- [配置](#配置)
- [装饰器/API 参考](#装饰器api-参考)
- [内置中间件](#内置中间件)
- [示例](#示例)
- [类型定义](#类型定义)
- [依赖关系](#依赖关系)
- [许可证](#许可证)

## 特性

- 🎯 **装饰器驱动**: 使用 TypeScript 装饰器定义路由和中间件
- 🔌 **模块化中间件**: 支持自定义和内置中间件，按声明顺序加载
- 🚀 **自动依赖注入**: 集成 @fastcar/core 的 IoC 容器
- 📁 **静态文件服务**: 内置静态文件和文件上传支持
- 🛡️ **全局异常处理**: 内置异常捕获中间件
- 📚 **Swagger 文档**: 支持 API 文档自动生成（需安装 swagger-ui-dist）
- 🔄 **代理支持**: 内置反向代理中间件

## 安装

```bash
npm install @fastcar/koa
# 或
yarn add @fastcar/koa
```

### 必需依赖

```bash
npm install @fastcar/core @fastcar/server koa @koa/router
```

### 可选依赖

根据功能需要安装：

```bash
# 文件上传
npm install @koa/multer multer

# 静态文件服务
npm install koa-static koa-range koa-mount

# 跨域支持
npm install koa2-cors

# 请求体解析
npm install @koa/bodyparser koa-body

# 反向代理
npm install http-proxy-middleware koa2-connect

# API 文档
npm install swagger-ui-dist

# 类型定义（TypeScript 项目）
npm install -D @types/koa @types/koa__multer @types/koa-mount @types/koa-range @types/koa-static @types/koa2-cors
```

## 快速开始

### 1. 创建应用入口

```typescript
import { FastCarApplication } from "@fastcar/core";
import { Application } from "@fastcar/core/annotation";
import { EnableKoa, KoaMiddleware } from "@fastcar/koa/annotation";
import { ExceptionGlobalHandler, KoaBodyParser } from "@fastcar/koa";

@Application
@EnableKoa
@KoaMiddleware(ExceptionGlobalHandler, KoaBodyParser)
class App {
  app!: FastCarApplication;
}

export const app = new App();
```

### 2. 创建控制器

```typescript
import { Controller } from "@fastcar/core/annotation";
import { GET, POST, RequestMapping } from "@fastcar/koa/annotation";
import { Context } from "koa";

@Controller
@RequestMapping("/api") // 基础路径前缀
export default class UserController {
  
  @GET("/users")
  async listUsers() {
    return { code: 200, data: [] };
  }

  @POST("/users")
  async createUser(data: any, ctx: Context) {
    // data 自动合并了 query、body 和 params
    return { code: 200, data: { id: 1, ...data } };
  }

  @GET("/users/:id")
  async getUser(data: { id: string }, ctx: Context) {
    // URL 参数在 ctx.params 中
    const userId = ctx.params.id;
    return { code: 200, data: { id: userId } };
  }
}
```

### 3. 配置文件 (application.yaml)

```yaml
koa:
  server:
    port: 3000
    hostname: "0.0.0.0"
  koaStatic:
    "/static": "./resource/static"  # 路径别名映射
  koaBodyOptions:
    multipart: true
    formidable:
      maxFileSize: 200 * 1024 * 1024  # 200MB
```

## 配置

### KoaConfig 类型

```typescript
type KoaConfig = {
  // 服务器配置，支持多端口监听
  server: ServerConfig | ServerConfig[];
  
  // 静态文件路径映射 { 访问路径: 文件系统路径 }
  koaStatic?: { [key: string]: string };
  
  // koa-body 配置（文件上传）
  koaBodyOptions?: { [key: string]: any };
  
  // @koa/bodyparser 配置
  koaBodyParser?: { [key: string]: any };
  
  // 反向代理配置
  koaProxy?: {
    [path: string]: {
      target: string;
      changeOrigin?: boolean;
      pathRewrite?: { [pattern: string]: string };
      ws?: boolean;
    };
  };
  
  // 其他扩展配置
  extra?: { [key: string]: any };
};
```

## 装饰器/API 参考

### 应用级装饰器

| 装饰器 | 用途 | 参数 |
|--------|------|------|
| `@EnableKoa` | 启用 Koa 组件 | 无 |
| `@KoaMiddleware(...middlewares)` | 注册中间件 | `...MiddleWareType[]` - 中间件函数数组，越靠前优先级越高 |

### 路由装饰器

| 装饰器 | HTTP 方法 | 简写别名 | 参数 |
|--------|-----------|----------|------|
| `@GetMapping(path)` | GET | `@GET` | `string` - 路由路径 |
| `@PostMapping(path)` | POST | `@POST` | `string` - 路由路径 |
| `@PutMapping(path)` | PUT | `@PUT` | `string` - 路由路径 |
| `@DeleteMapping(path)` | DELETE | `@DELETE` | `string` - 路由路径 |
| `@PatchMapping(path)` | PATCH | `@PATCH` | `string` - 路由路径 |
| `@AllMapping(path)` | ALL | `@ALL` | `string` - 路由路径 |
| `@RequestMapping(path)` | - | `@REQUEST` | `string` - 基础路径前缀 |

### 控制器装饰器

| 装饰器 | 用途 |
|--------|------|
| `@Controller` | 标记类为控制器，自动扫描路由 |

### 路由方法参数

控制器方法的参数约定：

```typescript
methodName(data: any, ctx: Context): any
```

- `data`: 自动合并 `query` + `body` + `params` 的对象（重名时 body 优先级最高）
- `ctx`: Koa 的 Context 对象，可访问 `ctx.params`, `ctx.request.body`, `ctx.query` 等
- 返回值: 自动设置为 `ctx.body`

## 内置中间件

### 1. ExceptionGlobalHandler

全局异常捕获，统一处理控制器抛出的错误。

```typescript
import { ExceptionGlobalHandler } from "@fastcar/koa";

@KoaMiddleware(ExceptionGlobalHandler)
```

### 2. KoaBodyParser

请求体解析（推荐），支持 JSON、表单等。

```typescript
import { KoaBodyParser } from "@fastcar/koa";

@KoaMiddleware(KoaBodyParser)
// 配合配置
// koaBodyParser:
//   jsonLimit: "1mb"
```

### 3. KoaBody

文件上传解析（基于 koa-body）。

```typescript
import { KoaBody } from "@fastcar/koa";

@KoaMiddleware(KoaBody)
// 配合配置
// koaBodyOptions:
//   multipart: true
```

### 4. KoaCors

跨域支持。

```typescript
import { KoaCors } from "@fastcar/koa";

@KoaMiddleware(KoaCors)
```

### 5. KoaStatic

静态文件服务（整合 koa-static + koa-range + koa-mount）。

```typescript
import { KoaStatic } from "@fastcar/koa";

@KoaMiddleware(KoaStatic)
// 配合配置
// koaStatic:
//   "/": "./resource/public"
//   "/uploads": "./uploads"
```

### 6. KoaMulter

增强的文件上传解析（基于 @koa/multer）。

```typescript
import { KoaMulter } from "@fastcar/koa";

@KoaMiddleware(KoaMulter)
```

### 7. KoaProxy

反向代理（基于 http-proxy-middleware）。

```typescript
import { KoaProxy } from "@fastcar/koa";

@KoaMiddleware(KoaProxy)
// 配合配置
// koaProxy:
//   "/api":
//     target: "http://backend-server:8080"
//     changeOrigin: true
```

### 8. Swagger

API 文档服务（需安装 swagger-ui-dist）。

```typescript
import { Swagger } from "@fastcar/koa";

@KoaMiddleware(Swagger)
// 访问 /swagger 查看文档
```

### 9. HeaderCoding

Header 编码校验。

```typescript
import { HeaderCoding } from "@fastcar/koa";

@KoaMiddleware(HeaderCoding)
```

## 示例

### 自定义中间件

```typescript
import * as Koa from "koa";
import { FastCarApplication } from "@fastcar/core";
import { KoaMiddleware } from "@fastcar/koa/annotation";

// 中间件工厂函数，接收 FastCarApplication 实例
function LoggerMiddleware(app: FastCarApplication): Koa.Middleware {
  return async (ctx: Koa.Context, next: Function) => {
    const start = Date.now();
    console.log(`--> ${ctx.method} ${ctx.url}`);
    
    await next();
    
    const duration = Date.now() - start;
    console.log(`<-- ${ctx.method} ${ctx.url} ${ctx.status} ${duration}ms`);
  };
}

@Application
@EnableKoa
@KoaMiddleware(LoggerMiddleware, ExceptionGlobalHandler, KoaBodyParser)
class App {
  app!: FastCarApplication;
}
```

### 多 HTTP 方法绑定

```typescript
import { Controller } from "@fastcar/core/annotation";
import { GetMapping, PostMapping } from "@fastcar/koa/annotation";

@Controller
export default class ResourceController {
  
  // 同一个方法支持多种 HTTP 方法
  @GetMapping("/resource")
  @PostMapping("/resource")
  handleResource(data: any) {
    return { method: 'GET or POST', data };
  }
}
```

### 文件上传

```typescript
import { Controller } from "@fastcar/core/annotation";
import { POST } from "@fastcar/koa/annotation";
import { Context } from "koa";

@Controller
export default class UploadController {
  
  @POST("/upload")
  async uploadFile(data: any, ctx: Context) {
    // 文件信息在 ctx.request.files 中
    const files = ctx.request.files;
    return { 
      code: 200, 
      message: "上传成功",
      files: Object.keys(files || {})
    };
  }
}
```

## 类型定义

### 导出路径

```typescript
// 主模块
import { KoaApplication, KoaConfig } from "@fastcar/koa";

// 装饰器
import { EnableKoa, KoaMiddleware, GET, POST, ... } from "@fastcar/koa/annotation";
```

### KoaApplication 类

```typescript
class KoaApplication {
  public koaApp: Koa;  // Koa 实例
  
  start(): void;       // 启动服务
  stop(): Promise<void>;  // 停止服务
}
```

### 中间件类型

```typescript
type MiddleWareType = (
  app: FastCarApplication, 
  koaApp?: Koa
) => Koa.Middleware | Koa.Middleware[] | Promise<Koa.Middleware | Koa.Middleware[]>;
```

## 依赖关系

```
@fastcar/koa
├── @fastcar/core (peer)    - IoC 容器和组件生命周期
├── @fastcar/server (peer)  - HTTP 服务器管理
├── koa (^3.1.1)            - Web 框架
└── @koa/router (^15.1.1)   - 路由
```

## 生命周期

1. **启动阶段**（按优先级）：
   - 加载自定义中间件（按 `@KoaMiddleware` 声明顺序）
   - 加载路由（扫描所有 `@Controller` 类）
   - 启动 HTTP 服务监听

2. **停止阶段**：
   - 延迟约 1 秒后关闭 server 连接

## 许可证

MIT License

---

**项目地址**: [https://github.com/williamDazhangyu/fast-car](https://github.com/williamDazhangyu/fast-car)
