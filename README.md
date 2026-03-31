# FastCar

<p align="center">
  <a href="https://github.com/williamDazhangyu/fast-car"><img src="https://img.shields.io/badge/GitHub-fast--car-blue?logo=github" alt="GitHub"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.6+-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white" alt="Node.js"></a>
</p>

FastCar 是一个基于 TypeScript 的 Node.js 企业级应用开发框架，采用 IoC（控制反转）设计思想，提供模块化、可扩展的架构支持，帮助开发者快速构建高性能、可维护的后端服务。

## ✨ 特性

- **🚀 IoC 容器** - 基于装饰器的依赖注入，实现组件的松耦合管理
- **📦 模块化设计** - 功能拆分为独立模块，按需引入，灵活组合
- **⚡ 高性能** - 支持工作线程池，解决 CPU 密集型任务性能瓶颈
- **🔧 丰富的组件生态** - 涵盖 Web、数据库、缓存、定时任务等常用功能
- **📊 配置化管理** - 支持 YAML 配置文件，环境切换便捷
- **🛡️ TypeScript 支持** - 完整的类型定义，提供优秀的开发体验

## 📚 核心模块

### 基础框架

| 模块 | 版本 | 说明 |
|------|------|------|
| [@fastcar/core](fastcar-core) | ![](https://img.shields.io/npm/v/@fastcar/core) | 核心框架，提供 IoC 容器、组件生命周期管理、配置管理 |
| [@fastcar/server](fastcar-server) | ![](https://img.shields.io/npm/v/@fastcar/server) | 服务统一管理，支持 HTTP/HTTPS/HTTP2/TCP 协议 |

### Web 开发

| 模块 | 版本 | 说明 |
|------|------|------|
| [@fastcar/koa](fastcar-koa) | ![](https://img.shields.io/npm/v/@fastcar/koa) | Web 组件，基于 Koa3，支持所有 Koa2 中间件 |

### 数据存储

| 模块 | 版本 | 说明 |
|------|------|------|
| [@fastcar/mysql](fastcar-mysql) | ![](https://img.shields.io/npm/v/@fastcar/mysql) | MySQL 组件，支持常用 CRUD 及事务管理 |
| [@fastcar/mysql-tool](fastcar-mysql-tool) | ![](https://img.shields.io/npm/v/@fastcar/mysql-tool) | MySQL 反向映射生成工具，支持从数据库生成 ORM 实体 |
| [@fastcar/pgsql](fastcar-pgsql) | ![](https://img.shields.io/npm/v/@fastcar/pgsql) | PostgreSQL 组件 |
| [@fastcar/mongo](fastcar-mongo) | ![](https://img.shields.io/npm/v/@fastcar/mongo) | MongoDB 组件，支持常用 CRUD 操作 |
| [@fastcar/redis](fastcar-redis) | ![](https://img.shields.io/npm/v/@fastcar/redis) | Redis 组件，支持常用缓存操作 |
| [@fastcar/cache](fastcar-cache) | ![](https://img.shields.io/npm/v/@fastcar/cache) | 缓存组件，用于频繁存储数据，减缓数据库写操作压力 |

### 任务与并发

| 模块 | 版本 | 说明 |
|------|------|------|
| [@fastcar/timer](fastcar-timer) | ![](https://img.shields.io/npm/v/@fastcar/timer) | 定时任务框架，支持间隔时间和 Cron 表达式 |
| [@fastcar/timewheel](fastcar-timewheel) | ![](https://img.shields.io/npm/v/@fastcar/timewheel) | 时间轮组件，用于高效管理延时任务 |
| [@fastcar/workerpool](fastcar-workerpool) | ![](https://img.shields.io/npm/v/@fastcar/workerpool) | 工作线程池组件，解决 CPU 密集计算性能瓶颈 |

### 通信与扩展

| 模块 | 版本 | 说明 |
|------|------|------|
| [@fastcar/rpc](fastcar-rpc) | ![](https://img.shields.io/npm/v/@fastcar/rpc) | RPC 组件，集成主流长连接协议 |
| [@fastcar/serverless](fastcar-serverless) | ![](https://img.shields.io/npm/v/@fastcar/serverless) | Serverless 支持组件 |
| [@fastcar/cos-sdk](fastcar-cos-sdk) | ![](https://img.shields.io/npm/v/@fastcar/cos-sdk) | 对象存储 SDK 组件 |
| [@fastcar/watchfile](fastcar-watchfile) | ![](https://img.shields.io/npm/v/@fastcar/watchfile) | 文件监控组件 |

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18.0.0
- [TypeScript](https://www.typescriptlang.org/) >= 5.0.0

### 安装

```bash
# 安装核心框架
npm install @fastcar/core

# 安装 Web 组件（可选）
npm install @fastcar/koa @fastcar/server

# 安装数据库组件（按需选择）
npm install @fastcar/mysql
# 或
npm install @fastcar/mongo
# 或
npm install @fastcar/redis
```

### 基础示例

```typescript
import { Application, ApplicationContext, Autowired, Component } from '@fastcar/core';
import { Get, RequestMapping } from '@fastcar/koa/annotation';

@Component
@RequestMapping('/hello')
class HelloController {
  
  @Get
  async index() {
    return { message: 'Hello, FastCar!' };
  }
}

@Application
class App {
  @Autowired()
  private appContext!: ApplicationContext;

  async start() {
    console.log('应用启动成功！');
  }
}

// 启动应用
const app = new App();
app.start();
```

## 🔧 开发规范

### 代码风格

项目采用 [Prettier](https://prettier.io/) 进行代码风格统一管理，配置位于根目录 `.prettierrc`：

```bash
# 格式化代码
npx prettier --write "**/*.ts"
```

### 模块引用约定

- **注解/装饰器**：`包名/annotation`
- **工具类**：`包名/utils`
- **数据库相关**：`包名/db`

示例：

```typescript
import { Component, Autowired } from '@fastcar/core/annotation';
import { DBUtil } from '@fastcar/core/utils';
```

### 调试配置

所有组件的调试配置位于 `.vscode/launch.json`，使用 VS Code 可直接进行断点调试。

## 📖 项目结构

```
fast-car/
├── fastcar-core/          # 核心框架
├── fastcar-koa/           # Web 组件
├── fastcar-server/        # 服务管理
├── fastcar-mysql/         # MySQL 支持
├── fastcar-mongo/         # MongoDB 支持
├── fastcar-redis/         # Redis 支持
├── fastcar-cache/         # 缓存组件
├── fastcar-timer/         # 定时任务
├── fastcar-workerpool/    # 工作线程池
├── fastcar-rpc/           # RPC 组件
├── fastcar-utils/         # 工具类
└── template/              # 项目模板
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](LICENSE)

---

## 🔗 相关链接

- GitHub: https://github.com/williamDazhangyu/fast-car
- Coding: https://william_zhong.coding.net/public/fast-car/fast-car/git/files
