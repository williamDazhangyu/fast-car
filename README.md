# fast-car

## 目录结构说明

* @fastcar/core 核心框架，用于支持组件的依赖注入和整个程序的声明周期运行

* @fastcar/koa web组件，支持http/https/http2的协议，所有支持koa2的中间件，均可实现采用

* @fastcar/timer 定时任务框架，支持间隔时间和cron的时间方式

* @fastcar/mysql mysql组件，支持常用的crud及事务的管理

* @fastcar/mysql-tool mysql反向映射生成工具，支持从数据库反向映射成对应的ORM

* @fastcar/redis redis组件，支持常用的操作

* @fastcar/mongo mongo组件，支持常用的crud

* @fastcar/cache cache组件, 支持缓存，用于频繁存储数据 减缓对数据库写操作的压力

## 代码风格约定

采用prettierrc进行代码风格统一管理

## 调试说明

所有组件调试 均在 .vscode/launch.json 内配置

## 引用约定

注解一般为 包名/annotation
引用到的类为 包名

## 项目地址

* git    <https://github.com/williamDazhangyu/fast-car>
* coding <https://william_zhong.coding.net/public/fast-car/fast-car/git/files>
