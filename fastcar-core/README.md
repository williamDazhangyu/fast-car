# 文档简要说明

## 好用的注入和依赖服务框架

* 通过注解实现组件的实例化和发现

* 提供类似于spring的注解方式(大部分同名的具有一样的功能)

## 基本思想

在一个入口类定义为Application 然后将各种组件通过依赖的方式加载进入内部，然后可以通过自动注入的方式进行组件的调用

## 基本功能

* 自动加载声明的组件

* 提供数据源的模板(方便对应不同的数据库实现curd操作)

* 提供自定义校验数据

## 快速安装

npm install fastcar-core

## 常用注解引用

ENV 用于指明环境

ApplicationStart 用于在程序启动后调用

ApplicationStop 用于在程序停止前调用

ApplicationRunner 用于声明程序是否在系统中启动

ApplicationInit  用于在程序启动后调用

ApplicationDestory 用于在程序停止前调用

ComponentScan 用于需要扫描的路径

ComponentScanExclusion 用于排除需要扫描的路径

Component 标注为组件

ComponentInjection  自定义组件入口

Hotter 指定热更新类 0.2.13 版本生效(当我们修改代码后,可以自动热加载文件)

BeanName 指明组件名称(每个组件具有一个系统生成id为"类名:16位随机值",为了便于调用可自定义逻辑名)

Configure 表明为配置组件

Controller 表明为控制组件

Service 表明为服务组件

Repository 表明为依赖的数据组件

Injection 拥有指定注入组件

Application 声明为一个应用

Autowired 自动注入依赖的组件,现在等同为CallDependency

CallDependency 调用时注入组件(调用对象可以不是组件 可以是一个普通类) 0.2.11版本以上生效

AliasInjection 根据别名注入组件

ExceptionMonitor 声明异常监听

Deprecate 用于标注方法是否被放弃 当调用时会提示已放弃该方法

NotImplemented 用于标注方法未实现

Override 用于标注方法已被重新实现

Readonly 作用于属性是否只读

Log  使用logger

AddRequireModule 自定义添加制定木块

AddChildValid 自定义添加校验模块

DefaultVal 标注属性的默认值

NotNull 标注属性不为空

Size 标注属性的大小

Type 标注属性类型

ValidCustom 校验自定义方法

ValidForm 校验表单开启

Rule 校验规则开启

ApplicationSetting 应用内配置设置 具有最高等级

## 约定

### 配置文件约定

* 所有项目配置文件均放在resource文件夹下
* application.yml (或者js,json) 代表应用配置文件
* application-{env}.yml (或者js,json) 代表不同环境的配置 在 application中可以采用env指定开发环境
* application 中 settings 代表第三方自定义组件或者值,  application代表应用设置
* 自定义配置可以通过注解Configure来进行映射(后续考虑支持url的配置)

### 应用程序约定

* 应用程序声明周期分为启动中->运行时->停止前->结束后
* 在介于启动中和运行时的阶段，可采用ApplicationStart进行相应的组件逻辑初始化操作
* 在停止前阶段，可采用ApplicationStop进行相应的组件结束操作

### 应用程序执行顺序

* 加载系统配置
* 扫描application所在目录或者指定目录下的组件，并注入实例
* 遍历所有实例，并进行装配所依赖的服务
* 运行所有标注为ApplicationStart的组件，而且是按照优先级顺序依次执行
* 服务停止前运行所有标注为ApplicationStop的组件，也是按照优先级顺序依次执行
* 结束运行

### 声明约定

* index.d.ts 代表实现的 Application及其他配置说明
* annotation.d.ts 代表所实现的注解
* utils.d.ts 代表基础的工具类

## 基本用法

```ts
//声明一个组件
import { Service } from "fastcar-core/annotation";

@Service
class HelloService {
  say() {
     console.info("hello world");
   }
}

export default HelloService;
```

```ts
//声明一个别名组件
import { Service, BeanName } from "fastcar-core/annotation";

@Service
@BeanName("HelloService")
class HelloService {
  say() {
     console.info("hello world");
   }
}

export default HelloService;
```

```ts
//引入依赖组件
import { Controller, Autowired } from "fastcar-core/annotation";

@Controller
class HelloController {

    //自动注入组件
    @Autowired
    private hello!: HelloService;

    callHello() {
      this.hello.say();
    }
}
```

```ts
//生命周期内运行
import { ApplicationStart } from "fastcar-core/annotation";

@ApplicationStart()
export default class StartRunner {
    run() {
        console.info("服务启动后调用的方法");
    }
}
```

```ts
//声明周期内运行
@ApplicationRunner
export default class StartRunner {
 @ApplicationInit() //可绑定多个方法
 run() {
  console.info("服务启动后调用的方法");
 }
}
```

```ts
//声明入口应用 这边有个约定 启动后会自动扫描所在文件夹下的文件 并进行注入
import { FastCarApplication } from "fastcar-core";
import { Application } from "fastcar-core/annotation";

@Application  //声明是一个应用
@ENV("TEST")  //声明为TEST环境或者在resource下的application.yml内声明
@Log() //启用默认日志注释
class APP {
  app!: FastCarApplication;
}
```

```ts
//表单示例
import { NotNull, Size, Rule, ValidForm } from "fastcar-core/annotation";

class B {
    @NotNull
    c!: string;

    @Size({ minSize: 1, maxSize: 10 })
    d?: number;
}

class A {

    @ValidForm  //开启表单校验
    test(a: string, @Rule() @NotNull b: B) {
      console.log(a, b);
    }
}

let instance = new A();
instance.test("a", { c: "c", d: 13 }); //校验失败
```

```ts
//本地配置映射示例
import { Configure } from "fastcar-core/annotation";

//读取resource下的配置 如hello.yml中为hello: "world"
@Configure("hello.yml")
class HelloConfig {
 hello!: string; //初始化完成后则为hello=world
}

//根据不同的环境加载不同的映射配置
@Configure(`evnconfig-${process.env.NODE_ENV}.yml`)
 class EnvConfig {
 text!: string;
}
```

```ts
//调用依赖版本示例
import HelloService from "./HelloService";
import { CallDependency } from "fastcar-core/annotation";

export default class CallService {

 //仅在调用时才会注入组件信息
 @CallDependency
 private hello!: HelloService;

 sayHello() {
  return this.hello.say();
 }
}
```

```ts
//指定文件热更新
@Controller
@Hotter //实例会被热更新或者在sesttings配置中配置 hotter为true
export default class IndexController {
 @Autowired
 private exampleService!: ExampleService;

 @GET("/")
 index() {
  return Result.ok("hello world");
 }
}
```

```ts
//改造一个好用的map-list数据链表
import { DataMap } from "fastcar-core";

describe("数据集合测试", () => {
 it("数据集合", () => {
      type User = {
        uid: number;
        name: string;
        desc?: {
          detail: string;
        };
      };

      let n: DataMap<number, User> = new DataMap();
      n.set(1, {
        uid: 1,
        name: "小明",
      });
      n.set(2, {
        uid: 2,
        name: "小王",
        desc: {
          detail: "住在隔壁",
        },
      });

      let xiaoming = n.get(1);
      console.log(xiaoming?.name == "小明"); //true

      let oo: { [key: number]: User } = n.toObject(); //序列化为一个key-value的对象
      console.log(oo[1]); // 小明

      let searchList = n.findByAtts({ uid: 1 }); //查找单一对象
      console.log(searchList);

      let searchList2 = n.findByAtts({ "desc.detail": "住在隔壁" }); 
      console.log(searchList2);

      let sortList = n.sort([
        {
          field: "uid",
          order: true, //true为倒序
        },
      ]);
      console.log(sortList);  //支持多重fields的排序 越在前面排序优先级越高
 });
});
```

```ts
//根据启动应用的时机 加载自定义方法
import { ApplicationHook, FastCarApplication, Logger } from "fastcar-core";
import { Application } from "fastcar-core/annotation";

@Application
class APP implements ApplicationHook {
 app!: FastCarApplication;

 @Log("app")
 logger!: Logger;

 beforeStartServer(): void {
  this.logger.debug("beforeStartServer-----");
 }

 startServer(): void {
  this.logger.debug("startServer------");
 }

 beforeStopServer(): void {
  this.logger.debug("beforeStopServer-----");
 }

 stopServer(): void {
  this.logger.debug("stopServer-----");
 }
}
```

## 更多用法

参考项目git地址 fastcar-core/test 下的simple内

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
