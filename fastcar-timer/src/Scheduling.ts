import "reflect-metadata";
import { TimeUnit } from "./ConstantTime";
import { Heartbeat, ScheduledConfig, ScheduledConfigCron, ScheduledConfigInterval } from "./HeartBeat";

const ScheduledModule = "ScheduledModule"; //定时任务模块
const TimerMapModule = "TimerModule"; //定时模块集合

function addScheduledModule(target: any, m: string) {
	if (!Reflect.hasMetadata(ScheduledModule, target)) {
		const emptySet = new Set<String>();
		Reflect.defineMetadata(ScheduledModule, emptySet, target);
		emptySet.add(m);
	} else {
		const tmpSet: Set<String> = Reflect.getMetadata(ScheduledModule, target);
		tmpSet.add(m);
	}
}

//计划函数
function Scheduled(config: ScheduledConfig) {
	return function(target: any, methodName: string, descriptor: PropertyDescriptor) {
		//进行绑定
		const fn = descriptor.value;
		addScheduledModule(target, methodName);

		//避免多次调用会重复触发
		descriptor.value = function(stop?: boolean) {
			let timeId = `${methodName}`;

			if (Reflect.hasMetadata(ScheduledModule, this)) {
				let funs: Set<String> = Reflect.getMetadata(ScheduledModule, this);
				if (funs.has(methodName)) {
					let timerMap = Reflect.getMetadata(TimerMapModule, this);

					if (!timerMap.has(timeId)) {
						//根据时间周期计算单位时间
						let timer = new Heartbeat(config);
						timer.start(fn, this);

						//增加一个定时器属性
						timerMap.set(timeId, timer);
					} else if (stop) {
						let timer: Heartbeat = timerMap.get(timeId);
						timer.stop();
						timerMap.delete(timeId);
					}
				}
			}
		};
	};
}

//开启定时任务 会在实例化的时候自动执行
export function EnableScheduling(target: any) {
	return new Proxy(target, {
		construct: (target: any, args: any) => {
			let service = new target(...args);

			const emptyMap = new Map<string, any>();
			Reflect.defineMetadata(TimerMapModule, emptyMap, service);
			if (Reflect.hasMetadata(ScheduledModule, service)) {
				const funs: Set<String> = Reflect.getMetadata(ScheduledModule, service);
				for (let fn of funs) {
					//依次调用
					Reflect.apply(service[fn.toString()], service, []);
				}
			}

			return service;
		},
	});
}

//定时处理间隔器
export function ScheduledInterval({ fixedRate = 1000, fixedRateString = TimeUnit.millisecond, initialDelay = 0 }: ScheduledConfigInterval) {
	return Scheduled({ fixedRate, fixedRateString, initialDelay });
}

//corn格式处理间隔
export function ScheduledCron({ cron, timezone = "Asia/Shanghai", initialDelay = 0 }: ScheduledConfigCron) {
	return Scheduled({ cron, timezone, initialDelay });
}
