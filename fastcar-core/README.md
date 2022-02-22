# 文档简要说明

## 描述

fastcar-core提供类似于spring的注解方式

## 基本思想

在一个入口类定义为Application 然后将各种组件通过依赖的方式加载进入内部，然后可以通过自动注入的方式进行组件的调用

## 基本功能

1.自动加载声明的组件
2.提供数据源的模板
3.提供自定义校验数据

## 快速安装

npm install fastcar-core

## 常用注解引用

ENV 用于指明环境

ApplicationStart 用于在程序启动后调用

ApplicationStop 用于在程序停止前调用

ComponentScan 用于需要扫描的路径

ComponentScanExclusion 用于排除需要扫描的路径

Component 标注为组件

ComponentInjection  自定义组件入口

BeanName 指明组件名称

Configure 表明为配置组件

Controller 表明为控制组件

Service 表明为服务组件

Repository 表明为依赖的数据组件

Injection 拥有指定注入组件

Application 声明为一个应用

Autowired 自动注入依赖的组件

ExceptionMonitor 声明异常监听

Deprecate 用于标注方法是否被放弃 当调用时会提示已放弃该方法

NotImplemented 用于标注方法未实现

Override 用于标注方法已被重新实现

Readonly 作用于属性是否只读

Log  制定日志配置

AddRequireModule 自定义添加制定木块

AddChildValid 自定义添加校验模块

DefaultVal 标注属性的默认值

NotNull 标注属性不为空

Size 标注属性的大小

Type 标注属性类型

ValidCustom 校验自定义方法

ValidForm 校验表单开启

Rule 校验规则开启

## 基本用法

```ts
import { FastCarApplication } from "fastcar-core";
import { Application } from "fastcar-core/annotation";

@Application  //声明是一个应用
@ENV("TEST")  //声明为TEST环境或者在resource下的application.yml内声明
@Log() //启用默认日志注释
class APP {
  app!: FastCarApplication;
}
```

## 更多用法

参考项目git地址 fastcar-core/test 下的simple内
