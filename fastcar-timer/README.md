# 定时任务计划

## 快速安装

npm install fastcar-timer

## 使用场景

用于定时任务或者cron表达式的任务计划执行

## 使用示例

* 基于时间间隔的调用

```ts
import { EnableScheduling, ScheduledInterval } from "fastcar-timer";

//开启调度计划
@EnableScheduling
class TimerTest {
   hello: string;

   constructor() {
    this.hello = "aaa";
   }

   //默认时间单位为ms 可使用其他计量单位也行
   //本注解的意思为 初始化执行延迟 1ms 每隔1s中执行一次
   @ScheduledInterval({ fixedRate: 1000, initialDelay: 1 })
   run() {
    console.log(this.hello);
   }
}

  new TimerTest(); //实例化后触发条件
```

* 基于cron的调用

```ts
import { EnableScheduling, ScheduledCron } from "fastcar-timer";

//开启调度计划
@EnableScheduling
class TimerTest {
   hello: string;

   constructor() {
    this.hello = "bbb";
   }

   //含义为每隔1s执行一次
   @ScheduledCron({ cron: "*/1 * * * * *" })
   run() {
    console.log(this.hello);
   }
}

new TimerTest();
```

* ScheduledCron 与 ScheduledInterval区别, 前者精度最小为1S 后者精度最小为5ms(具体看nodejs限制)

* cron的实现方式是引用node-cron加以实现

## 注解说明

EnableScheduling 作用于类上 用于表示开启定时任务执行计划

ScheduledInterval 作用于具体方法上 任务按照固定间隔执行

ScheduledCron 作用于具体方法上 任务按照cron表达式执行

## 更多用法

参考项目git地址 fastcar-timer/test

## 项目开源地址

* 项目下载 git clone <https://github.com/williamDazhangyu/fast-car.git>

* 在线查看 <https://github.com/williamDazhangyu/fast-car>
