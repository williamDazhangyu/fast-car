# @fastcar/core

<p align="center">
  <strong>🚀 A lightweight Node.js IoC dependency injection framework, inspired by Spring Boot</strong>
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
  <a href="./README.md">🇨🇳 中文</a> | 🇺🇸 <strong>English</strong>
</p>

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Core Concepts](#-core-concepts)
- [Annotations Reference](#-annotations-reference)
- [Configuration](#-configuration)
- [Lifecycle](#-lifecycle)
- [Hot Reload](#-hot-reload)
- [Form Validation](#-form-validation)
- [Utilities](#-utilities)
- [API Documentation](#-api-documentation)
- [Examples](#-examples)
- [License](#-license)

---

## ✨ Features

- **📦 IoC Container**: Decorator-based dependency injection with automatic component discovery and assembly
- **🔍 Component Scanning**: Auto-scan and register components from specified paths
- **⚙️ Configuration Management**: Multi-format support (YAML/JSON/JS) with environment isolation
- **🔄 Hot Reload**: Automatic code reloading in development environment
- **📊 Logging System**: Winston-based logging management
- **✅ Form Validation**: Declarative parameter validation
- **🗄️ Data Access**: Data source management and transaction control
- **📈 Performance Monitoring**: Built-in memory usage statistics

---

## 🚀 Quick Start

### Installation

```bash
npm install @fastcar/core
```

### Basic Example

**1. Create Entry Application**

```ts
// app.ts
import { FastCarApplication } from "@fastcar/core";
import { Application, ENV, Log } from "@fastcar/core/annotation";

@Application
@ENV("dev")  // Specify runtime environment
@Log()       // Enable logging
class App {
  app!: FastCarApplication;
}
```

**2. Declare Service Component**

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

**3. Use Dependency Injection**

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

**4. Startup Lifecycle**

```ts
// component/StartRunner.ts
import { ApplicationStart } from "@fastcar/core/annotation";

@ApplicationStart()
export default class StartRunner {
  run() {
    console.log("✅ Server started!");
  }
}
```

**5. Configure resource/application.yml**

```yaml
application:
  name: my-app
  version: 1.0.0
  env: dev
```

---

## 🧩 Core Concepts

### Component Types

| Decorator | Purpose | Description |
|-----------|---------|-------------|
| `@Application` | Entry Application | Declare application startup class |
| `@Controller` | Controller | Handle external requests (HTTP/WebSocket, etc.) |
| `@Service` | Service Layer | Business logic processing |
| `@Repository` | Data Layer | Data access operations |
| `@Component` | General Component | Basic injectable component |
| `@Configure` | Configuration Class | Map config files to class properties |

### Dependency Injection Methods

```ts
// 1. Autowired (recommended)
@Autowired
private helloService!: HelloService;

// 2. Named injection
@Autowired
@BeanName("UserService")
private userService!: UserService;

// 3. Alias injection
@AliasInjection("cache")
private cacheService!: CacheService;

// 4. Call-time injection (lazy loading)
@CallDependency
private lazyService!: LazyService;
```

---

## 📖 Annotations Reference

### Environment Configuration

| Annotation | Parameters | Description | Version |
|------------|------------|-------------|---------|
| `@ENV(name)` | `string` | Set runtime environment | - |
| `@BasePath(path)` | `string` | Set entry folder path | - |
| `@BaseFilePath(path)` | `string` | Set entry file path | - |
| `@BaseName(name)` | `string` | Set config file base name | - |
| `@ResourcePath(path)` | `string` | Custom resource folder location | - |
| `@ApplicationSetting(settings)` | `object` | In-app config (highest priority) | - |

### Component Scanning

| Annotation | Parameters | Description | Version |
|------------|------------|-------------|---------|
| `@ComponentScan(...paths)` | `string[]` | Specify scan paths | - |
| `@ComponentScanExclusion(...paths)` | `string[]` | Exclude scan paths | - |
| `@ComponentScanMust(...paths)` | `string[]` | Must-scan paths (not excluded) | 0.2.58+ |
| `@ComponentInjection(target, ...paths)` | - | Manual component injection | - |

### Lifecycle

| Annotation | Parameters | Description |
|------------|------------|-------------|
| `@ApplicationStart(order?, exec?)` | `number`, `string` | Execute on startup, lower order = higher priority |
| `@ApplicationStop(order?, exec?)` | `number`, `string` | Execute before shutdown |
| `@ApplicationRunner` | - | Declare as runnable component |
| `@ApplicationInit(order?)` | `number` | Init method (with `@ApplicationRunner`) |
| `@ApplicationDestory(order?)` | `number` | Destroy method |

### Hot Reload

| Annotation | Description | Version |
|------------|-------------|---------|
| `@Hotter` | Enable class hot reload | 0.2.13+ |
| `@HotterCallBack(fn)` | Callback method name after hot reload | 0.3.5+ |
| `@HotterDemand(path)` | On-demand hot reload for specific files | - |
| `@DemandInjection` | Declare as on-demand injection component | 0.3.0+ |

### Validation

| Annotation | Parameters | Description |
|------------|------------|-------------|
| `@ValidForm` | - | Enable method parameter validation |
| `@Rule(rules?)` | `object` | Validation rule configuration |
| `@NotNull` | - | Parameter cannot be null |
| `@Size({minSize?, maxSize?})` | `object` | Numeric/string size limit |
| `@Type(type)` | `string` | Specify parameter type |
| `@DefaultVal(val)` | `any` | Set default value |
| `@ValidCustom(fn, msg?)` | `function`, `string` | Custom validation method |
| `@CustomType(name)` | `string` | Custom type marker |

### Data Access

| Annotation | Parameters | Description |
|------------|------------|-------------|
| `@Table(name)` | `string` | Map database table name |
| `@Field(name)` | `string` | Map database field |
| `@PrimaryKey` | - | Mark as primary key |
| `@IsSerial` | - | Mark as auto-increment field |
| `@DBType(type)` | `string` | Specify database type |
| `@DS(name)` | `string` | Specify data source |
| `@DSIndex` | - | Data source index parameter marker |
| `@Entity(class)` | `Function` | Entity class mapping |
| `@SqlSession` | - | Session parameter marker |
| `@Transactional(driver?)` | `string` | Transaction control |

### Others

| Annotation | Parameters | Description |
|------------|------------|-------------|
| `@Log(category?)` | `string` | Inject logger instance |
| `@Value(key, target?)` | `string`, `object` | Get config value | 0.3.2+ |
| `@AppEnv` | - | Get runtime environment | 0.3.2+ |
| `@Deprecate(msg?)` | `string` | Mark method as deprecated |
| `@NotImplemented` | - | Mark method as not implemented |
| `@Override` | - | Mark method as overridden |
| `@Readonly` | - | Mark property as read-only |
| `@ExceptionMonitor` | - | Exception monitoring |

---

## ⚙️ Configuration

### Configuration File Convention

```
resource/
├── application.yml          # Main config
├── application-dev.yml      # Development environment config
├── application-prod.yml     # Production environment config
└── custom.yml               # Custom config
```

### Configuration Example

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
  # Enable hot reload
  hotter: true
  hotterSysConfig: true
  
  # Logging config
  log:
    level: debug
    maxFiles: 5
    maxSize: 10m
```

### Configuration Class Mapping

```ts
import { Configure } from "@fastcar/core/annotation";

// Map resource/hello.yml
@Configure("hello.yml")
class HelloConfig {
  hello!: string;  // Auto-mapped to "world"
}

// Environment-aware config
@Configure(`config-${process.env.NODE_ENV}.yml`)
class EnvConfig {
  dbHost!: string;
  dbPort!: number;
}
```

### Dynamic Config Access

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

## 🔄 Lifecycle

### Execution Order

```
1. Load system config (loadSysConfig)
2. Scan components (loadClass)
3. Assemble dependencies (loadInjectionService)
4. Execute @ApplicationStart methods (sorted by order)
5. ⏳ Server running...
6. Execute @ApplicationStop methods (sorted by order)
7. Server stopped
```

### Hook Interface

```ts
import { ApplicationHook, FastCarApplication, Logger } from "@fastcar/core";
import { Application, Log } from "@fastcar/core/annotation";

@Application
class App implements ApplicationHook {
  app!: FastCarApplication;

  @Log("app")
  logger!: Logger;

  // Before startup
  beforeStartServer(): void {
    this.logger.debug("Preparing to start...");
  }

  // Startup complete
  startServer(): void {
    this.logger.debug("Server started");
  }

  // Before shutdown
  beforeStopServer(): void {
    this.logger.debug("Preparing to stop...");
  }

  // Shutdown complete
  stopServer(): void {
    this.logger.debug("Server stopped");
  }
}
```

### Priority Settings

```ts
import { BootPriority } from "@fastcar/core";

// Infrastructure starts first
@ApplicationStart(BootPriority.System)
class DatabaseInit {
  run() {
    // Initialize database connection
  }
}

// Business services start after
@ApplicationStart(BootPriority.Base)
class BusinessInit {
  run() {
    // Initialize business logic
  }
}
```

---

## ♨️ Hot Reload

### Enable Hot Reload

```ts
// app.ts - Enable global hot reload
@Application
@ENV("dev")
class App {
  app!: FastCarApplication;
}

// resource/application.yml
settings:
  hotter: true
  hotterSysConfig: true  # Config file hot reload
```

### Class-specific Hot Reload

```ts
@Controller
@Hotter  // This class will be hot-reloaded
export default class IndexController {
  @Autowired
  private service!: ExampleService;

  @HotterCallBack("onReload")  // Callback after hot reload
  onReload() {
    console.log("Controller hot reloaded");
  }
}
```

### On-demand Hot Reload

```ts
// For non-component classes that need hot reload
@DemandInjection
@HotterDemand("./utils/helper.ts")
export default class HelperService {
  @HotterCallBack("init")
  init() {
    console.log("HelperService reloaded");
  }
}
```

---

## ✅ Form Validation

### Basic Validation

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
    // Parameters auto-validated
    console.log(user);
  }
}
```

### Complex Validation

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
    // Process order
  }
}
```

### Custom Validation

```ts
const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

class UserDTO {
  @ValidCustom(isEmail, "Invalid email format")
  email!: string;
}
```

---

## 🛠️ Utilities

The framework includes rich utility classes, importable from `@fastcar/core/utils`:

```ts
import { 
  DateUtil,       // Date/time processing
  DataFormat,     // Data type formatting
  CryptoUtil,     // Encryption/decryption
  FileUtil,       // File operations
  TypeUtil,       // Type checking
  ValidationUtil, // Data validation
  FormatStr,      // String formatting
  ClassUtils,     // Class operations
  ClassLoader,    // Class loading
  MixTool,        // Object mixing/copying
  IPUtils,        // IP address utilities
  FilterCondition // Condition filtering
} from "@fastcar/core/utils";
```

### Utilities Overview

| Utility | Main Function | Common Methods |
|---------|---------------|----------------|
| `DateUtil` | Date/time formatting and conversion | `toDateTime()`, `toDay()`, `getTimeStr()` |
| `DataFormat` | Data type formatting conversion | `formatValue()`, `formatNumber()`, `formatBoolean()` |
| `CryptoUtil` | Encryption/decryption operations | `aesEncode()`, `aesDecode()`, `sha256Encode()` |
| `FileUtil` | File system operations | `getFilePathList()`, `getResource()`, `formatBytes()` |
| `TypeUtil` | Type checking | `isFunction()`, `isClass()`, `isPromise()` |
| `ValidationUtil` | Data validation | `isNotNull()`, `isNumber()`, `checkType()` |
| `FormatStr` | String formatting | `formatFirstToUp()`, `formatFirstToLow()` |
| `ClassUtils` | Class metadata operations | `getProtoType()`, `cloneMetadata()` |
| `ClassLoader` | Module loading and hot reload | `loadModule()`, `watchServices()` |
| `MixTool` | Object property copying | `mix()`, `copyProperties()`, `assign()` |
| `IPUtils` | IP address checking | `isInnerIP()` |
| `FilterCondition` | Query condition building | `filterNull()`, `addFiled()` |

---

### DateUtil Details

Date/time processing utility with formatting, conversion, and countdown features.

#### Method List

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `toDateDesc(datetime?)` | `number \| string \| Date` | `{YYYY, MM, DD, hh, mm, ss, ms}` | Return date/time components |
| `toDay(datetime?, format?)` | `datetime`, `format="YYYY-MM-DD"` | `string` | Format date part |
| `toHms(datetime?, format?)` | `datetime`, `format="hh:mm:ss"` | `string` | Format time part |
| `toDateTime(datetime?, format?)` | `datetime`, `format="YYYY-MM-DD hh:mm:ss"` | `string` | Full date/time formatting |
| `toDateTimeMS(datetime?, format?)` | `datetime`, `format="YYYY-MM-DD hh:mm:ss.sss"` | `string` | With milliseconds |
| `toCutDown(seconds, format?)` | `number`, `format="hh:mm:ss"` | `string` | Countdown formatting |
| `getTimeStr(milliseconds)` | `number` | `string` | Friendly duration display (e.g., "2.5h") |
| `getDateTime(datetimeStr?)` | `string \| number` | `number` | Convert to timestamp |

#### Usage Examples

```ts
import { DateUtil } from "@fastcar/core/utils";

// 1. Format current date/time
const now = DateUtil.toDateTime(); // "2024-03-10 15:30:45"

// 2. Custom format
const custom = DateUtil.toDateTime(Date.now(), "YYYY-MM-DD hh:mm");

// 3. Date only
const date = DateUtil.toDay(); // "2024-03-10"
const usDate = DateUtil.toDay(Date.now(), "MM/DD/YYYY"); // "03/10/2024"

// 4. Time only
const time = DateUtil.toHms(); // "15:30:45"

// 5. With milliseconds
const withMs = DateUtil.toDateTimeMS(); // "2024-03-10 15:30:45.123"

// 6. Countdown (seconds input)
const countdown = DateUtil.toCutDown(3665); // "1:1:5" (1h 1m 5s)

// 7. Friendly duration
const duration1 = DateUtil.getTimeStr(86400000); // "1.00d"
const duration2 = DateUtil.getTimeStr(3600000);  // "1.00h"
const duration3 = DateUtil.getTimeStr(60000);    // "1.00m"
const duration4 = DateUtil.getTimeStr(5000);     // "5s"

// 8. To timestamp
const timestamp = DateUtil.getDateTime("2024-03-10 15:30:00");

// 9. Get components
const desc = DateUtil.toDateDesc();
// { YYYY: "2024", MM: "03", DD: "10", hh: "15", mm: "30", ss: "45", ms: "123" }
```

---

### DataFormat Details

Data type formatting utility for converting any value to specified types.

#### Method List

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `formatValue(value, type)` | `any`, `string` | `any` | Universal formatting entry |
| `formatNumber(value, type)` | `any`, `"int" \| "float" \| "number"` | `number \| null` | Format as number |
| `formatString(value)` | `any` | `string \| null` | Format as string |
| `formatBoolean(value)` | `any` | `boolean` | Format as boolean |
| `formatArray(value, type)` | `any[]`, `string` | `any[]` | Format as array |
| `formatDate(value)` | `any` | `Date` | Format as Date object |

#### Supported Types

| Type | Description | Example |
|------|-------------|---------|
| `"string"` | String | `"123"` → `"123"` |
| `"int"` | Integer | `"123.45"` → `123` |
| `"float"` / `"number"` | Float | `"123.45"` → `123.45` |
| `"boolean"` | Boolean | `"true"` → `true` |
| `"date"` | Date object | `"2024-03-10"` → `Date` |
| `"array<T>"` | Array (T=element type) | `"[1,2,3]"` → `[1,2,3]` |

#### Usage Examples

```ts
import { DataFormat } from "@fastcar/core/utils";

// 1. Universal formatting
const num = DataFormat.formatValue("123.45", "int");      // 123
const float = DataFormat.formatValue("123.45", "float");  // 123.45
const str = DataFormat.formatValue(123, "string");        // "123"
const bool = DataFormat.formatValue("true", "boolean");   // true
const date = DataFormat.formatValue("2024-03-10", "date"); // Date object

// 2. Array formatting
const arr = DataFormat.formatValue('[1, 2, 3]', "arrayint"); // [1, 2, 3]
const strArr = DataFormat.formatValue('["a", "b"]', "arraystring"); // ["a", "b"]

// 3. Number formatting
DataFormat.formatNumber("42", "int");      // 42
DataFormat.formatNumber("3.14", "float");  // 3.14
DataFormat.formatNumber("abc", "int");     // null

// 4. String formatting
DataFormat.formatString(123);        // "123"
DataFormat.formatString(true);       // "true"
DataFormat.formatString(null);       // null

// 5. Boolean formatting (smart parsing)
DataFormat.formatBoolean("true");    // true
DataFormat.formatBoolean("false");   // false
DataFormat.formatBoolean("1");       // true
DataFormat.formatBoolean("0");       // false
DataFormat.formatBoolean(1);         // true
DataFormat.formatBoolean(0);         // false

// 6. Date formatting
DataFormat.formatDate("2024-03-10");           // Date object
DataFormat.formatDate(1710055800000);          // Date object
DataFormat.formatDate(new Date());             // Returns as-is
```

---

### Other Common Utilities

#### CryptoUtil - Encryption/Decryption

```ts
import { CryptoUtil } from "@fastcar/core/utils";

// AES encode/decode
const encrypted = CryptoUtil.aesEncode(key, iv, "secret data");
const decrypted = CryptoUtil.aesDecode(key, iv, encrypted);

// SHA256 HMAC
const hash = CryptoUtil.shaEncode(key, "data");

// AES-128-GCM (compatible with Java AES/GCM/PKCS5Padding)
const gcmEncrypted = CryptoUtil.gcmEncrypt(password, "message");
const gcmDecrypted = CryptoUtil.gcmDecrypt(password, gcmEncrypted);

// SHA256 with salt
const { salt, msg } = CryptoUtil.sha256Encode("password");
const isValid = CryptoUtil.sha256Very("password", salt, msg);

// Generate random string
const randomKey = CryptoUtil.getHashStr(16); // 32-char hex string
```

#### FileUtil - File Operations

```ts
import { FileUtil } from "@fastcar/core/utils";

// Recursively get all files in directory
const files = FileUtil.getFilePathList("./src");

// Get file extension
const suffix = FileUtil.getSuffix("/path/to/file.ts"); // "ts"

// Get filename (without extension)
const name = FileUtil.getFileName("/path/to/file.ts"); // "file"

// Load config file (supports .yml, .json, .js)
const config = FileUtil.getResource("./resource/app.yml");

// Format byte size
const size = FileUtil.formatBytes(1024 * 1024 * 5); // "5.00(M)"
```

#### TypeUtil - Type Checking

```ts
import { TypeUtil } from "@fastcar/core/utils";

TypeUtil.isFunction(() => {});      // true
TypeUtil.isClass(MyClass);          // true
TypeUtil.isPromise(async () => {}); // true
TypeUtil.isArray([1, 2, 3]);        // true
TypeUtil.isDate(new Date());        // true
TypeUtil.isMap(new Map());          // true
TypeUtil.isSet(new Set());          // true
TypeUtil.isTSORJS("/path/file.ts"); // true (excludes .d.ts)
```

#### ValidationUtil - Data Validation

```ts
import { ValidationUtil } from "@fastcar/core/utils";

ValidationUtil.isNotNull("value");           // true
ValidationUtil.isNotNull("");                // false
ValidationUtil.isNotNull(null);              // false
ValidationUtil.isNotNull({});                // false
ValidationUtil.isNotNull({a: 1});            // true

ValidationUtil.isNumber("123");              // true
ValidationUtil.isNumber("abc");              // false

// Size validation (supports string length, array length, numeric comparison)
ValidationUtil.isNotMinSize("hello", 3);     // true (length >= 3)
ValidationUtil.isNotMinSize(10, 5);          // true (value >= 5)
ValidationUtil.isNotMinSize([1,2,3], 2);     // true (array length >= 2)

// Type checking
ValidationUtil.checkType("123", "string");   // true
ValidationUtil.checkType(123, "int");        // true
ValidationUtil.checkType([1,2], "arrayint"); // true
```

#### MixTool - Object Mixing and Copying

```ts
import { MixTool } from "@fastcar/core/utils";

// Mix multiple classes
class A { a() {} }
class B { b() {} }
const Mixed = MixTool.mix(A, B);
const instance = new Mixed(); // Has a() and b() methods

// Copy properties
const target = {};
const source = { name: "test", value: 123 };
MixTool.copyProperties(target, source);

// Object assignment (includes prototype methods)
MixTool.assign(target, source);
```

#### FilterCondition - Condition Filtering

```ts
import { FilterCondition } from "@fastcar/core/utils";

// Build query conditions
const where = { name: "test", age: null, status: "active" };
const filter = new FilterCondition(where, { excludeField: ["age"] });
filter.filterNull(); // Filter null values
console.log(filter.toObject()); // { name: "test", status: "active" }

// Add fields
filter.addFiled({ createdAt: new Date() });
```

---

## 📚 API Documentation

### FastCarApplication Core Methods

| Method | Return | Description |
|--------|--------|-------------|
| `init()` | `void` | Initialize and start application |
| `getBean(key)` | `Object \| null` | Get component instance by key |
| `getComponentByName(name)` | `Object \| null` | Get component by name |
| `getComponentByTarget(target)` | `T \| null` | Get component by prototype |
| `getComponentByType(type)` | `any[]` | Get components by type |
| `hasComponentByName(name)` | `boolean` | Check if component exists |
| `getSetting(key)` | `any` | Get config value |
| `setSetting(key, value)` | `void` | Set config value |
| `getapplicationConfig()` | `ApplicationConfig` | Get application config |
| `getResourcePath()` | `string` | Get resource folder path |
| `getBasePath()` | `string` | Get project base path |
| `getSysLogger()` | `Logger` | Get system logger |
| `getLogger(category?)` | `Logger` | Get categorized logger |
| `getMemoryUsage()` | `ProcessType` | Get memory usage info |
| `specifyHotUpdate(path)` | `void` | Specify file for hot reload |
| `getFileContent(path)` | `string` | Read file content |

### DataMap Utility

```ts
import { DataMap } from "@fastcar/core";

type User = {
  uid: number;
  name: string;
  age?: number;
};

const userMap = new DataMap<number, User>();

// Add data
userMap.set(1, { uid: 1, name: "Alice", age: 20 });
userMap.set(2, { uid: 2, name: "Bob", age: 18 });

// Get data
const user = userMap.get(1);

// Convert to array
const users = userMap.toValues();  // [{uid: 1, ...}, {uid: 2, ...}]

// Conditional search
const result = userMap.findByAtts({ age: 20 });
const result2 = userMap.findByAtts({ name: ["Alice", "Bob"] });  // OR query

// Sorting
const sorted = userMap.sort([
  { field: "age", order: true },  // true = descending
  { field: "name", order: false }  // false = ascending
]);

// Convert to plain object
const obj = userMap.toObject();  // { 1: {...}, 2: {...} }
```

---

## 📂 Examples

Reference examples in the project repository:

```
fastcar-core/test/example/simple/
├── app.ts                    # Application entry
├── app-test.ts               # Test environment entry
├── component/
│   ├── StartRunner.ts        # Startup component
│   └── StopRunner.ts         # Shutdown component
├── config/
│   ├── HelloConfig.ts        # Config class example
│   └── EnvConfig.ts          # Environment config example
├── controller/
│   ├── HelloController.ts    # Controller example
│   └── AliasController.ts    # Alias injection example
└── service/
    ├── HelloService.ts       # Service layer example
    └── CallService.ts        # Call injection example
```

Run example:

```bash
cd fastcar-core
npm install
npm run build
npx ts-node test/example/simple/app.ts
```

---

## 📜 License

This project is open-sourced under the [MIT](LICENSE) license.

---

## 🔗 Links

- **GitHub**: https://github.com/williamDazhangyu/fast-car
- **NPM**: https://www.npmjs.com/package/@fastcar/core
- **Issues**: https://github.com/williamDazhangyu/fast-car/issues

---

<p align="center">
  If this project helps you, please give it a ⭐ Star!
</p>
