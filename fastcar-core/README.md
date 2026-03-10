# @fastcar/core

<p align="center">
  <strong>🚀 一款轻量级的 Node.js IoC 依赖注入框架，灵感源于 Spring Boot</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@fastcar/core">
    <img src="https://img.shields.io/npm/v/@fastcar/core.svg" alt="npm version">
  </a>
  <a href="https://github.com/williamDazhangyu/fast-car">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-green.svg" alt="node version">
</p>

<p align="center">
  🇨🇳 <strong>中文</strong> | <a href="./README.en.md">🇺🇸 English</a>
</p>

---

## 📋 目录

- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [核心概念](#-核心概念)
- [注解参考](#-注解参考)
- [配置管理](#-配置管理)
- [生命周期](#-生命周期)
- [热更新](#-热更新)
- [表单验证](#-表单验证)
- [工具类](#%EF%B8%8F-工具类)
- [API 文档](#-api-文档)
- [示例项目](#-示例项目)
- [开源协议](#-开源协议)

---

## ✨ 功能特性

- **📦 IoC 容器**: 基于装饰器的依赖注入，实现组件的自动发现与装配
- **🔍 组件扫描**: 自动扫描并注册指定路径下的组件
- **⚙️ 配置管理**: 支持 YAML/JSON/JS 多格式配置，环境隔离
- **🔄 热更新**: 开发环境下代码修改自动热加载
- **📊 日志系统**: 基于 Winston 的日志管理
- **✅ 表单验证**: 声明式参数校验
- **🗄️ 数据访问**: 支持数据源管理和事务控制
- **📈 性能监控**: 内置内存使用统计

---

## 🚀 快速开始

### 安装

```bash
npm install @fastcar/core
```

### 基础示例

**1. 创建入口应用**

```ts
// app.ts
import { FastCarApplication } from "@fastcar/core";
import { Application, ENV, Log } from "@fastcar/core/annotation";

@Application
@ENV("dev")  // 指定运行环境
@Log()       // 启用日志
class App {
  app!: FastCarApplication;
}
```

**2. 声明服务组件**

```ts
// service/HelloService.ts
import { Service } from "@fastcar/core/annotation";

@Service
export default class HelloService {
  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }
}
```

**3. 使用依赖注入**

```ts
// controller/HelloController.ts
import { Controller, Autowired } from "@fastcar/core/annotation";
import HelloService from "../service/HelloService";

@Controller
export default class HelloController {
  @Autowired
  private helloService!: HelloService;

  greet(name: string): string {
    return this.helloService.sayHello(name);
  }
}
```

**4. 启动生命周期**

```ts
// component/StartRunner.ts
import { ApplicationStart } from "@fastcar/core/annotation";

@ApplicationStart()
export default class StartRunner {
  run() {
    console.log("✅ 服务已启动!");
  }
}
```

**5. 配置 resource/application.yml**

```yaml
application:
  name: my-app
  version: 1.0.0
  env: dev
```

---

## 🧩 核心概念

### 组件类型

| 装饰器 | 用途 | 说明 |
|--------|------|------|
| `@Application` | 入口应用 | 声明应用启动类 |
| `@Controller` | 控制器 | 处理外部请求（HTTP/WebSocket等） |
| `@Service` | 服务层 | 业务逻辑处理 |
| `@Repository` | 数据层 | 数据访问操作 |
| `@Component` | 通用组件 | 基础可注入组件 |
| `@Configure` | 配置类 | 映射配置文件到类属性 |

### 依赖注入方式

```ts
// 1. 自动注入（推荐）
@Autowired
private helloService!: HelloService;

// 2. 指定名称注入
@Autowired
@BeanName("UserService")
private userService!: UserService;

// 3. 别名注入
@AliasInjection("cache")
private cacheService!: CacheService;

// 4. 调用时注入（延迟加载）
@CallDependency
private lazyService!: LazyService;
```

---

## 📖 注解参考

### 环境配置

| 注解 | 参数 | 说明 | 版本 |
|------|------|------|------|
| `@ENV(name)` | `string` | 设置运行环境 | - |
| `@BasePath(path)` | `string` | 设置入口文件夹路径 | - |
| `@BaseFilePath(path)` | `string` | 设置入口文件路径 | - |
| `@BaseName(name)` | `string` | 设置配置文件基础名 | - |
| `@ResourcePath(path)` | `string` | 自定义资源文件夹位置 | - |
| `@ApplicationSetting(settings)` | `object` | 程序内配置设置（最高优先级） | - |

### 组件扫描

| 注解 | 参数 | 说明 | 版本 |
|------|------|------|------|
| `@ComponentScan(...paths)` | `string[]` | 指定扫描路径 | - |
| `@ComponentScanExclusion(...paths)` | `string[]` | 排除扫描路径 | - |
| `@ComponentScanMust(...paths)` | `string[]` | 必须扫描的路径（不会被排除） | 0.2.58+ |
| `@ComponentInjection(target, ...paths)` | - | 手动注入组件 | - |

### 生命周期

| 注解 | 参数 | 说明 |
|------|------|------|
| `@ApplicationStart(order?, exec?)` | `number`, `string` | 启动时执行，`order`越小优先级越高 |
| `@ApplicationStop(order?, exec?)` | `number`, `string` | 停止前执行 |
| `@ApplicationRunner` | - | 声明为可运行组件 |
| `@ApplicationInit(order?)` | `number` | 初始化方法（配合`@ApplicationRunner`） |
| `@ApplicationDestory(order?)` | `number` | 销毁方法 |

### 热更新

| 注解 | 说明 | 版本 |
|------|------|------|
| `@Hotter` | 启用类热更新 | 0.2.13+ |
| `@HotterCallBack(fn)` | 热更新后回调方法名 | 0.3.5+ |
| `@HotterDemand(path)` | 按需热更新指定文件 | - |
| `@DemandInjection` | 声明为按需注入组件 | 0.3.0+ |

### 属性校验

| 注解 | 参数 | 说明 |
|------|------|------|
| `@ValidForm` | - | 开启方法参数校验 |
| `@Rule(rules?)` | `object` | 校验规则配置 |
| `@NotNull` | - | 参数不能为空 |
| `@Size({minSize?, maxSize?})` | `object` | 数值/字符串大小限制 |
| `@Type(type)` | `string` | 指定参数类型 |
| `@DefaultVal(val)` | `any` | 设置默认值 |
| `@ValidCustom(fn, msg?)` | `function`, `string` | 自定义校验方法 |
| `@CustomType(name)` | `string` | 自定义类型标记 |

### 数据访问

| 注解 | 参数 | 说明 |
|------|------|------|
| `@Table(name)` | `string` | 映射数据库表名 |
| `@Field(name)` | `string` | 映射数据库字段 |
| `@PrimaryKey` | - | 标记主键 |
| `@IsSerial` | - | 标记自增字段 |
| `@DBType(type)` | `string` | 指定数据库类型 |
| `@DS(name)` | `string` | 指定数据源 |
| `@DSIndex` | - | 数据源索引参数标记 |
| `@Entity(class)` | `Function` | 实体类映射 |
| `@SqlSession` | - | 会话参数标记 |
| `@Transactional(driver?)` | `string` | 事务控制 |

### 其他

| 注解 | 参数 | 说明 |
|------|------|------|
| `@Log(category?)` | `string` | 注入日志实例 |
| `@Value(key, target?)` | `string`, `object` | 获取配置值 | 0.3.2+ |
| `@AppEnv` | - | 获取运行环境 | 0.3.2+ |
| `@Deprecate(msg?)` | `string` | 标记方法已废弃 |
| `@NotImplemented` | - | 标记方法未实现 |
| `@Override` | - | 标记方法已重写 |
| `@Readonly` | - | 标记属性只读 |
| `@ExceptionMonitor` | - | 异常监听 |

---

## ⚙️ 配置管理

### 配置文件约定

```
resource/
├── application.yml          # 主配置
├── application-dev.yml      # 开发环境配置
├── application-prod.yml     # 生产环境配置
└── custom.yml               # 自定义配置
```

### 配置示例

**application.yml**
```yaml
application:
  name: my-app
  version: 1.0.0
  env: dev
  scan:
    include:
      - "src/service"
    exclude:
      - "src/test"

settings:
  # 启用热更新
  hotter: true
  hotterSysConfig: true
  
  # 日志配置
  log:
    level: debug
    maxFiles: 5
    maxSize: 10m
```

### 配置类映射

```ts
import { Configure } from "@fastcar/core/annotation";

// 映射 resource/hello.yml
@Configure("hello.yml")
class HelloConfig {
  hello!: string;  // 自动映射为 "world"
}

// 环境感知配置
@Configure(`config-${process.env.NODE_ENV}.yml`)
class EnvConfig {
  dbHost!: string;
  dbPort!: number;
}
```

### 动态获取配置

```ts
import { Value, AppEnv } from "@fastcar/core/annotation";

@Service
export default class ConfigService {
  @Value("sys.log.level")
  logLevel!: string;

  @Value("application.name")
  appName!: string;

  @AppEnv
  env!: string;
}
```

---

## 🔄 生命周期

### 执行顺序

```
1. 加载系统配置 (loadSysConfig)
2. 扫描组件 (loadClass)
3. 装配依赖 (loadInjectionService)
4. 执行 @ApplicationStart 方法 (按 order 排序)
5. ⏳ 服务运行中...
6. 执行 @ApplicationStop 方法 (按 order 排序)
7. 服务停止
```

### 钩子接口

```ts
import { ApplicationHook, FastCarApplication, Logger } from "@fastcar/core";
import { Application, Log } from "@fastcar/core/annotation";

@Application
class App implements ApplicationHook {
  app!: FastCarApplication;

  @Log("app")
  logger!: Logger;

  // 启动前
  beforeStartServer(): void {
    this.logger.debug("准备启动...");
  }

  // 启动完成
  startServer(): void {
    this.logger.debug("服务已启动");
  }

  // 停止前
  beforeStopServer(): void {
    this.logger.debug("准备停止...");
  }

  // 停止完成
  stopServer(): void {
    this.logger.debug("服务已停止");
  }
}
```

### 优先级设置

```ts
import { BootPriority } from "@fastcar/core";

// 数据库等基础设施优先启动
@ApplicationStart(BootPriority.System)
class DatabaseInit {
  run() {
    // 初始化数据库连接
  }
}

// 业务服务随后启动
@ApplicationStart(BootPriority.Base)
class BusinessInit {
  run() {
    // 初始化业务逻辑
  }
}
```

---

## ♨️ 热更新

### 启用热更新

```ts
// app.ts - 启用全局热更新
@Application
@ENV("dev")
class App {
  app!: FastCarApplication;
}

// resource/application.yml
settings:
  hotter: true
  hotterSysConfig: true  # 配置文件热更新
```

### 指定类热更新

```ts
@Controller
@Hotter  // 该类会被热更新
export default class IndexController {
  @Autowired
  private service!: ExampleService;

  @HotterCallBack("onReload")  // 热更新后回调
  onReload() {
    console.log("控制器已热更新");
  }
}
```

### 按需热更新

```ts
// 用于非组件类但需热更新的场景
@DemandInjection
@HotterDemand("./utils/helper.ts")
export default class HelperService {
  @HotterCallBack("init")
  init() {
    console.log("HelperService 已重新加载");
  }
}
```

---

## ✅ 表单验证

### 基础验证

```ts
import { ValidForm, NotNull, Size, Rule } from "@fastcar/core/annotation";

class UserDTO {
  @NotNull
  name!: string;

  @Size({ minSize: 1, maxSize: 150 })
  age!: number;
}

class UserController {
  @ValidForm
  createUser(@Rule() @NotNull user: UserDTO) {
    // 参数自动校验
    console.log(user);
  }
}
```

### 复杂验证

```ts
import { ValidForm, NotNull, Size, ValidCustom, Rule } from "@fastcar/core/annotation";

class OrderDTO {
  @NotNull
  orderId!: string;

  @Size({ minSize: 1 })
  items!: OrderItem[];
}

class OrderService {
  @ValidForm
  createOrder(
    @Rule({
      orderId: { type: "string", required: true },
      items: { type: "array", min: 1 }
    })
    order: OrderDTO
  ) {
    // 处理订单
  }
}
```

### 自定义校验

```ts
const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

class UserDTO {
  @ValidCustom(isEmail, "邮箱格式不正确")
  email!: string;
}
```

---

## 🛠️ 工具类

框架内置了丰富的工具类，可通过 `@fastcar/core/utils` 导入使用：

```ts
import { 
  DateUtil,       // 日期时间处理
  DataFormat,     // 数据类型格式化
  CryptoUtil,     // 加密解密
  FileUtil,       // 文件操作
  TypeUtil,       // 类型判断
  ValidationUtil, // 数据校验
  FormatStr,      // 字符串格式化
  ClassUtils,     // 类操作
  ClassLoader,    // 类加载
  MixTool,        // 对象混合/复制
  IPUtils,        // IP 地址工具
  FilterCondition // 条件过滤器
} from "@fastcar/core/utils";
```

### 工具类概览

| 工具类 | 主要功能 | 常用方法 |
|--------|----------|----------|
| `DateUtil` | 日期时间格式化与转换 | `toDateTime()`, `toDay()`, `getTimeStr()` |
| `DataFormat` | 数据类型格式化转换 | `formatValue()`, `formatNumber()`, `formatBoolean()` |
| `CryptoUtil` | 加密解密操作 | `aesEncode()`, `aesDecode()`, `sha256Encode()` |
| `FileUtil` | 文件系统操作 | `getFilePathList()`, `getResource()`, `formatBytes()` |
| `TypeUtil` | 类型判断 | `isFunction()`, `isClass()`, `isPromise()` |
| `ValidationUtil` | 数据校验 | `isNotNull()`, `isNumber()`, `checkType()` |
| `FormatStr` | 字符串格式化 | `formatFirstToUp()`, `formatFirstToLow()` |
| `ClassUtils` | 类元数据操作 | `getProtoType()`, `cloneMetadata()` |
| `ClassLoader` | 模块加载与热更新 | `loadModule()`, `watchServices()` |
| `MixTool` | 对象属性复制 | `mix()`, `copyProperties()`, `assign()` |
| `IPUtils` | IP 地址判断 | `isInnerIP()` |
| `FilterCondition` | 查询条件构建 | `filterNull()`, `addFiled()` |

---

### DateUtil 详解

日期时间处理工具类，支持格式化、转换、倒计时等功能。

#### 方法列表

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `toDateDesc(datetime?)` | `number \| string \| Date` | `{YYYY, MM, DD, hh, mm, ss, ms}` | 返回日期时间各组成部分 |
| `toDay(datetime?, format?)` | `datetime`, `format="YYYY-MM-DD"` | `string` | 格式化日期部分 |
| `toHms(datetime?, format?)` | `datetime`, `format="hh:mm:ss"` | `string` | 格式化时间部分 |
| `toDateTime(datetime?, format?)` | `datetime`, `format="YYYY-MM-DD hh:mm:ss"` | `string` | 完整日期时间格式化 |
| `toDateTimeMS(datetime?, format?)` | `datetime`, `format="YYYY-MM-DD hh:mm:ss.sss"` | `string` | 含毫秒的日期时间格式化 |
| `toCutDown(seconds, format?)` | `number`, `format="hh:mm:ss"` | `string` | 倒计时格式化 |
| `getTimeStr(milliseconds)` | `number` | `string` | 时间跨度友好显示（如 "2.5h"） |
| `getDateTime(datetimeStr?)` | `string \| number` | `number` | 转换为时间戳 |

#### 使用示例

```ts
import { DateUtil } from "@fastcar/core/utils";

// 1. 格式化当前日期时间
const now = DateUtil.toDateTime(); // "2024-03-10 15:30:45"

// 2. 自定义格式
const custom = DateUtil.toDateTime(Date.now(), "YYYY年MM月DD日 hh时mm分"); 
// "2024年03月10日 15时30分"

// 3. 仅获取日期
const date = DateUtil.toDay(); // "2024-03-10"
const usDate = DateUtil.toDay(Date.now(), "MM/DD/YYYY"); // "03/10/2024"

// 4. 仅获取时间
const time = DateUtil.toHms(); // "15:30:45"

// 5. 含毫秒的格式化
const withMs = DateUtil.toDateTimeMS(); // "2024-03-10 15:30:45.123"

// 6. 倒计时格式化（传入秒数）
const countdown = DateUtil.toCutDown(3665); // "1:1:5" (1小时1分5秒)
const formatted = DateUtil.toCutDown(3665, "hh小时mm分ss秒"); // "1小时1分5秒"

// 7. 时间跨度友好显示
const duration1 = DateUtil.getTimeStr(86400000); // "1.00d" (1天)
const duration2 = DateUtil.getTimeStr(3600000);  // "1.00h" (1小时)
const duration3 = DateUtil.getTimeStr(60000);    // "1.00m" (1分钟)
const duration4 = DateUtil.getTimeStr(5000);     // "5s" (5秒)

// 8. 转换为时间戳
const timestamp = DateUtil.getDateTime("2024-03-10 15:30:00"); // 1710055800000
const nowTs = DateUtil.getDateTime(); // 当前时间戳

// 9. 获取日期各部分
const desc = DateUtil.toDateDesc();
// { YYYY: "2024", MM: "03", DD: "10", hh: "15", mm: "30", ss: "45", ms: "123" }
```

---

### DataFormat 详解

数据类型格式化工具类，用于将任意值转换为指定类型的数据。

#### 方法列表

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `formatValue(value, type)` | `any`, `string` | `any` | 通用格式化入口 |
| `formatNumber(value, type)` | `any`, `"int" \| "float" \| "number"` | `number \| null` | 格式化为数字 |
| `formatString(value)` | `any` | `string \| null` | 格式化为字符串 |
| `formatBoolean(value)` | `any` | `boolean` | 格式化为布尔值 |
| `formatArray(value, type)` | `any[]`, `string` | `any[]` | 格式化为数组 |
| `formatDate(value)` | `any` | `Date` | 格式化为日期对象 |

#### 支持的类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `"string"` | 字符串 | `"123"` → `"123"` |
| `"int"` | 整数 | `"123.45"` → `123` |
| `"float"` / `"number"` | 浮点数 | `"123.45"` → `123.45` |
| `"boolean"` | 布尔值 | `"true"` → `true` |
| `"date"` | 日期对象 | `"2024-03-10"` → `Date` |
| `"array<T>"` | 数组（T为元素类型） | `"[1,2,3]"` → `[1,2,3]` |

#### 使用示例

```ts
import { DataFormat } from "@fastcar/core/utils";

// 1. 通用格式化
const num = DataFormat.formatValue("123.45", "int");      // 123
const float = DataFormat.formatValue("123.45", "float");  // 123.45
const str = DataFormat.formatValue(123, "string");        // "123"
const bool = DataFormat.formatValue("true", "boolean");   // true
const date = DataFormat.formatValue("2024-03-10", "date"); // Date对象

// 2. 数组格式化
const arr = DataFormat.formatValue('[1, 2, 3]', "arrayint"); // [1, 2, 3]
const strArr = DataFormat.formatValue('["a", "b"]', "arraystring"); // ["a", "b"]

// 3. 数字格式化
DataFormat.formatNumber("42", "int");      // 42
DataFormat.formatNumber("3.14", "float");  // 3.14
DataFormat.formatNumber("abc", "int");     // null

// 4. 字符串格式化
DataFormat.formatString(123);        // "123"
DataFormat.formatString(true);       // "true"
DataFormat.formatString(null);       // null
DataFormat.formatString({toString: () => "custom"}); // "custom"

// 5. 布尔值格式化（智能解析）
DataFormat.formatBoolean("true");    // true
DataFormat.formatBoolean("false");   // false
DataFormat.formatBoolean("1");       // true
DataFormat.formatBoolean("0");       // false
DataFormat.formatBoolean(1);         // true
DataFormat.formatBoolean(0);         // false
DataFormat.formatBoolean("yes");     // true (非空字符串)
DataFormat.formatBoolean("");        // false

// 6. 日期格式化
DataFormat.formatDate("2024-03-10");           // Date对象
DataFormat.formatDate(1710055800000);          // Date对象
DataFormat.formatDate(new Date());             // 原样返回
```

---

### 其他常用工具类

#### CryptoUtil - 加密解密

```ts
import { CryptoUtil } from "@fastcar/core/utils";

// AES 加密/解密
const encrypted = CryptoUtil.aesEncode(key, iv, "secret data");
const decrypted = CryptoUtil.aesDecode(key, iv, encrypted);

// SHA256 HMAC
const hash = CryptoUtil.shaEncode(key, "data");

// AES-128-GCM（与 Java AES/GCM/PKCS5Padding 兼容）
const gcmEncrypted = CryptoUtil.gcmEncrypt(password, "message");
const gcmDecrypted = CryptoUtil.gcmDecrypt(password, gcmEncrypted);

// SHA256 加盐哈希
const { salt, msg } = CryptoUtil.sha256Encode("password");
const isValid = CryptoUtil.sha256Very("password", salt, msg);

// 生成随机字符串
const randomKey = CryptoUtil.getHashStr(16); // 32位十六进制字符串
```

#### FileUtil - 文件操作

```ts
import { FileUtil } from "@fastcar/core/utils";

// 递归获取目录下所有文件
const files = FileUtil.getFilePathList("./src");

// 获取文件后缀
const suffix = FileUtil.getSuffix("/path/to/file.ts"); // "ts"

// 获取文件名（不含后缀）
const name = FileUtil.getFileName("/path/to/file.ts"); // "file"

// 加载配置文件（支持 .yml, .json, .js）
const config = FileUtil.getResource("./resource/app.yml");

// 格式化字节大小
const size = FileUtil.formatBytes(1024 * 1024 * 5); // "5.00(M)"
```

#### TypeUtil - 类型判断

```ts
import { TypeUtil } from "@fastcar/core/utils";

TypeUtil.isFunction(() => {});      // true
TypeUtil.isClass(MyClass);          // true
TypeUtil.isPromise(async () => {}); // true
TypeUtil.isArray([1, 2, 3]);        // true
TypeUtil.isDate(new Date());        // true
TypeUtil.isMap(new Map());          // true
TypeUtil.isSet(new Set());          // true
TypeUtil.isTSORJS("/path/file.ts"); // true (排除 .d.ts)
```

#### ValidationUtil - 数据校验

```ts
import { ValidationUtil } from "@fastcar/core/utils";

ValidationUtil.isNotNull("value");           // true
ValidationUtil.isNotNull("");                // false
ValidationUtil.isNotNull(null);              // false
ValidationUtil.isNotNull({});                // false
ValidationUtil.isNotNull({a: 1});            // true

ValidationUtil.isNumber("123");              // true
ValidationUtil.isNumber("abc");              // false

// 大小校验（支持字符串长度、数组长度、数值比较）
ValidationUtil.isNotMinSize("hello", 3);     // true (长度 >= 3)
ValidationUtil.isNotMinSize(10, 5);          // true (数值 >= 5)
ValidationUtil.isNotMinSize([1,2,3], 2);     // true (数组长度 >= 2)

// 类型校验
ValidationUtil.checkType("123", "string");   // true
ValidationUtil.checkType(123, "int");        // true
ValidationUtil.checkType([1,2], "arrayint"); // true
```

#### MixTool - 对象混合与复制

```ts
import { MixTool } from "@fastcar/core/utils";

// 混合多个类
class A { a() {} }
class B { b() {} }
const Mixed = MixTool.mix(A, B);
const instance = new Mixed(); // 拥有 a() 和 b() 方法

// 复制属性
const target = {};
const source = { name: "test", value: 123 };
MixTool.copyProperties(target, source);

// 对象赋值（包括原型方法）
MixTool.assign(target, source);
```

#### FilterCondition - 条件过滤

```ts
import { FilterCondition } from "@fastcar/core/utils";

// 构建查询条件
const where = { name: "test", age: null, status: "active" };
const filter = new FilterCondition(where, { excludeField: ["age"] });
filter.filterNull(); // 过滤空值
console.log(filter.toObject()); // { name: "test", status: "active" }

// 添加字段
filter.addFiled({ createdAt: new Date() });
```

---

## 📚 API 文档

### FastCarApplication 核心方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `init()` | `void` | 初始化并启动应用 |
| `getBean(key)` | `Object \| null` | 根据 key 获取组件实例 |
| `getComponentByName(name)` | `Object \| null` | 根据名称获取组件 |
| `getComponentByTarget(target)` | `T \| null` | 根据原型获取组件 |
| `getComponentByType(type)` | `any[]` | 根据类型获取组件列表 |
| `hasComponentByName(name)` | `boolean` | 判断组件是否存在 |
| `getSetting(key)` | `any` | 获取配置值 |
| `setSetting(key, value)` | `void` | 设置配置值 |
| `getapplicationConfig()` | `ApplicationConfig` | 获取应用配置 |
| `getResourcePath()` | `string` | 获取资源文件夹路径 |
| `getBasePath()` | `string` | 获取项目基础路径 |
| `getSysLogger()` | `Logger` | 获取系统日志 |
| `getLogger(category?)` | `Logger` | 获取指定分类日志 |
| `getMemoryUsage()` | `ProcessType` | 获取内存使用信息 |
| `specifyHotUpdate(path)` | `void` | 指定文件热更新 |
| `getFileContent(path)` | `string` | 读取文件内容 |

### DataMap 工具类

```ts
import { DataMap } from "@fastcar/core";

type User = {
  uid: number;
  name: string;
  age?: number;
};

const userMap = new DataMap<number, User>();

// 添加数据
userMap.set(1, { uid: 1, name: "小明", age: 20 });
userMap.set(2, { uid: 2, name: "小红", age: 18 });

// 获取数据
const user = userMap.get(1);

// 转换为数组
const users = userMap.toValues();  // [{uid: 1, ...}, {uid: 2, ...}]

// 条件查找
const result = userMap.findByAtts({ age: 20 });  // [{uid: 1, name: "小明", age: 20}]
const result2 = userMap.findByAtts({ name: ["小明", "小红"] });  // OR查询

// 排序
const sorted = userMap.sort([
  { field: "age", order: true },  // true 为降序
  { field: "name", order: false }  // false 为升序
]);

// 转为普通对象
const obj = userMap.toObject();  // { 1: {...}, 2: {...} }
```

---

## 📂 示例项目

参考项目仓库中的示例：

```
fastcar-core/test/example/simple/
├── app.ts                    # 应用入口
├── app-test.ts               # 测试环境入口
├── component/
│   ├── StartRunner.ts        # 启动组件
│   └── StopRunner.ts         # 停止组件
├── config/
│   ├── HelloConfig.ts        # 配置类示例
│   └── EnvConfig.ts          # 环境配置示例
├── controller/
│   ├── HelloController.ts    # 控制器示例
│   └── AliasController.ts    # 别名注入示例
└── service/
    ├── HelloService.ts       # 服务层示例
    └── CallService.ts        # 调用注入示例
```

运行示例：

```bash
cd fastcar-core
npm install
npm run build
npx ts-node test/example/simple/app.ts
```

---

## 📜 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

---

## 🔗 相关链接

- **GitHub**: https://github.com/williamDazhangyu/fast-car
- **NPM**: https://www.npmjs.com/package/@fastcar/core
- **问题反馈**: https://github.com/williamDazhangyu/fast-car/issues

---

<p align="center">
  如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！
</p>
