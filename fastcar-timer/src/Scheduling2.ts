import "reflect-metadata";
import { TimeUnit } from "./ConstantTime";
import { Heartbeat, ScheduledConfig, ScheduledConfigCron, ScheduledConfigInterval } from "./HeartBeat";

const ScheduledModule = Symbol("ScheduledModule"); //定时任务模块
const TimerMapModule = Symbol("TimerModule"); //定时模块集合

function cloneMetadata(src: any, dst: any): void {
	const keys: any[] = Reflect.getMetadataKeys(src);
	for (const k of keys) {
		const val = Reflect.getMetadata(k, src);
		Reflect.defineMetadata(k, val, dst);
	}
}

function addScheduledModule(target: any, m: string, config: ScheduledConfig = {}) {
	let map: Map<string, ScheduledConfig> = Reflect.getMetadata(ScheduledModule, target);

	if (!map) {
		map = new Map<string, ScheduledConfig>();
		Reflect.defineMetadata(ScheduledModule, map, target);
	}

	map.set(m, config);
}

//计划函数
function Scheduled(config: ScheduledConfig) {
	return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
		//进行绑定
		addScheduledModule(target, methodName, config);
	};
}

//开启定时任务 会在实例化的时候自动执行z
export function EnableScheduling(target: any) {
	let proxy = new Proxy(target, {
		construct: (target: any, args: any, newTarget: any) => {
			let service = Reflect.construct(target, args, newTarget) as any;
			if (Reflect.hasMetadata(ScheduledModule, service)) {
				const heartbetMap = new Map<string, Heartbeat>();
				Reflect.defineMetadata(TimerMapModule, heartbetMap, service);
				const funs: Map<string, ScheduledConfig> = Reflect.getMetadata(ScheduledModule, service);
				for (let [fn, config] of funs) {
					if (Reflect.has(service, fn)) {
						heartbetMap.set(fn, new Heartbeat(config).start(fn, service));
					}
				}
			}
			return service;
		},
	});

	//拷贝原属性
	cloneMetadata(target, proxy);
	return proxy;
}

//定时处理间隔器
export function ScheduledInterval({ fixedRate = 1000, fixedRateString = TimeUnit.millisecond, initialDelay = 0 }: ScheduledConfigInterval) {
	return Scheduled({ fixedRate, fixedRateString, initialDelay });
}

//corn格式处理间隔
export function ScheduledCron({ cron, timezone = "Asia/Shanghai", initialDelay = 0 }: ScheduledConfigCron) {
	return Scheduled({ cron, timezone, initialDelay });
}

export function getHeartbeat(target: any, methodName: string): Heartbeat | undefined {
	const heartbetMap: Map<string, Heartbeat> = Reflect.getMetadata(TimerMapModule, target);
	return heartbetMap.get(methodName);
}

export function destoryHeartbet(target: any, methodName: string) {
	const heartbetMap: Map<string, Heartbeat> = Reflect.getMetadata(TimerMapModule, target);
	const hb = heartbetMap.get(methodName);

	if (hb) {
		hb.stop();
		heartbetMap.delete(methodName);
	}
}

export function destoryHeartbetAll(target: any) {
	const heartbetMap: Map<string, Heartbeat> = Reflect.getMetadata(TimerMapModule, target);
	heartbetMap.forEach((hb) => {
		hb.stop();
	});
	heartbetMap.clear();
}
