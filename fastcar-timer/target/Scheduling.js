"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledCron = exports.ScheduledInterval = exports.EnableScheduling = void 0;
require("reflect-metadata");
const ConstantTime_1 = require("./ConstantTime");
const HeartBeat_1 = require("./HeartBeat");
const ScheduledModule = "ScheduledModule"; //定时任务模块
const TimerMapModule = "TimerModule"; //定时模块集合
function addScheduledModule(target, m) {
    if (!Reflect.hasMetadata(ScheduledModule, target)) {
        const emptySet = new Set();
        Reflect.defineMetadata(ScheduledModule, emptySet, target);
        emptySet.add(m);
    }
    else {
        const tmpSet = Reflect.getMetadata(ScheduledModule, target);
        tmpSet.add(m);
    }
}
//计划函数
function Scheduled(config) {
    return function (target, methodName, descriptor) {
        //进行绑定
        const fn = descriptor.value;
        addScheduledModule(target, methodName);
        //避免多次调用会重复触发
        descriptor.value = function (stop) {
            let timeId = `${methodName}`;
            if (Reflect.hasMetadata(ScheduledModule, this)) {
                let funs = Reflect.getMetadata(ScheduledModule, this);
                if (funs.has(methodName)) {
                    let timerMap = Reflect.getMetadata(TimerMapModule, this);
                    if (!timerMap.has(timeId)) {
                        //根据时间周期计算单位时间
                        let timer = new HeartBeat_1.Heartbeat(config);
                        timer.start(fn, this);
                        //增加一个定时器属性
                        timerMap.set(timeId, timer);
                    }
                    else if (stop) {
                        let timer = timerMap.get(timeId);
                        timer.stop();
                        timerMap.delete(timeId);
                    }
                }
            }
        };
    };
}
//开启定时任务 会在实例化的时候自动执行
function EnableScheduling(target) {
    return new Proxy(target, {
        construct: (target, args) => {
            let service = new target(...args);
            const emptyMap = new Map();
            Reflect.defineMetadata(TimerMapModule, emptyMap, service);
            if (Reflect.hasMetadata(ScheduledModule, service)) {
                const funs = Reflect.getMetadata(ScheduledModule, service);
                for (let fn of funs) {
                    //依次调用
                    Reflect.apply(service[fn.toString()], service, []);
                }
            }
            return service;
        },
    });
}
exports.EnableScheduling = EnableScheduling;
//定时处理间隔器
function ScheduledInterval({ fixedRate = 1000, fixedRateString = ConstantTime_1.TimeUnit.millisecond, initialDelay = 0 }) {
    return Scheduled({ fixedRate, fixedRateString, initialDelay });
}
exports.ScheduledInterval = ScheduledInterval;
//corn格式处理间隔
function ScheduledCron({ cron, timezone = "Asia/Shanghai", initialDelay = 0 }) {
    return Scheduled({ cron, timezone, initialDelay });
}
exports.ScheduledCron = ScheduledCron;
