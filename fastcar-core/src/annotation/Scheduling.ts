import { ScheduledModule, TimerMapModule } from "../common/ConstantFile";
import { TimeUnit } from "../common/ConstantTime";
import Heartbeat, { ScheduledConfig, ScheduledConfigCron, ScheduledConfigInterval } from '../utils/HeartBeat';

function addScheduledModule(target: any, m: string) {

    if (!Reflect.has(target, ScheduledModule)) {

        target[ScheduledModule] = new Set<String>();
    }

    target[ScheduledModule].add(m);
};

//开启定时任务 会在实例化的时候自动执行
export function EnableScheduling(target: any) {

    //提供一个可以销毁的定时器方法
    target.prototype.removeTimer = function (methodName: string) {

        let timeId = `${methodName}_timerId`;

        if (this[TimerMapModule].has(timeId)) {

            let timer: Heartbeat = this[TimerMapModule].get(timeId);
            timer.stop();
            this[TimerMapModule].delete(timeId);
        }
    };

    return new Proxy(target, {

        construct: (target: any, args: any) => {

            let service = new target(...args);
            service[TimerMapModule] = new Map<string, any>();
            if (Reflect.has(service, ScheduledModule)) {

                let funs: Set<String> = service[ScheduledModule];
                for (let fn of funs) {

                    //依次调用
                    Reflect.apply(service[fn.toString()], service, []);
                };
            }

            return service;
        },
    });
};

//计划函数
export function Scheduled(config: ScheduledConfig) {

    return function (target: any, methodName: string, descriptor: PropertyDescriptor) {

        //进行绑定
        const fn = descriptor.value;
        addScheduledModule(target, methodName);

        //多次调用会重复触发
        descriptor.value = function () {

            let timeId = `${methodName}_timerId`;

            if (Reflect.has(this, ScheduledModule)) {

                let funs: Set<String> = Reflect.get(this, ScheduledModule);
                if (funs.has(methodName)) {

                    let timerMap = Reflect.get(this, TimerMapModule);

                    if (!timerMap.has(timeId)) {

                        //根据时间周期计算单位时间
                        let timer = new Heartbeat(config);
                        timer.start(fn, this);

                        //增加一个定时器属性
                        timerMap.set(timeId, timer);
                    }
                }
            }
        };
    };
};

//定时处理间隔器
export function ScheduledInterval({ fixedRate = 1000, fixedRateString = TimeUnit.millisecond, initialDelay = 0 }: ScheduledConfigInterval) {

    return Scheduled({ fixedRate, fixedRateString, initialDelay });
};

//corn格式处理间隔
export function ScheduledCron({ cron, timezone = "Asia/Shanghai", initialDelay = 0 }: ScheduledConfigCron) {

    return Scheduled({ cron, timezone, initialDelay });
};