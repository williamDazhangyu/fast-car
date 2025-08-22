# 时间轮

## 快速安装

npm install @fastcar/timewheel

## 使用场景

针对于处理大量的定时任务时，可以按照时间轮更平滑的处理

## 使用示例

``` ts
import {HashedWheelTimer} from "@fastcar/timewheel"

const hashedWheelTimer = new HashedWheelTimer<number>({
	tickDuration: 100, //处理间隔
	wheelSize: 60, //最大轮子
	slotMaxSize: 100000, //最大的一次处理数量 如果处理不完则挪到下一个时间轮上
});

//在合适的地方进行追加
hashedWheelTimer.add(1, 1000);

//在时间间隔上处理 拿到key值进行后续处理 todo
let ids = hashedWheelTimer.tick();
```
