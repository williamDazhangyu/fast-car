import { ScheduledConfig, ScheduledConfigInterval, ScheduledConfigCron } from "./src/HeartBeat";

type RetProperty = (target: any, methodName: string, descriptor: PropertyDescriptor) => void;

export * from "./src/ConstantTime";
//作用于类上用于是否开启定时状态任务
export function EnableScheduling(target: any): any;

//开启定时任务按照间隔方式
export function ScheduledInterval(s: ScheduledConfigInterval): RetProperty;

//开启定时任务按照cron方式
export function ScheduledCron(s: ScheduledConfigCron): RetProperty;

//导出类型
export { ScheduledConfig, ScheduledConfigInterval, ScheduledConfigCron } from "./src/HeartBeat";

//暴露心跳类
export class Heartbeat {
	/**
	 *
	 * @param fixedRate  1000
	 * @param fixedRateString TimeUnit.millisecond
	 */
	private getInterval(fixedRate?: number, fixedRateString?: string): number;

	/***
	 * @params ScheduledConfig
	 * @params fixedRate = 1000, fixedRateString = TimeUnit.millisecond, initialDelay = 0, cron, timezone = "Asia/Shanghai"
	 */
	constructor({ fixedRate, fixedRateString, initialDelay, cron, timezone }: ScheduledConfig);

	//开启任务
	start(fn: Function, context: any): void;

	/***
	 * @version 1.0 每次跳动执行函数
	 * @default delay = this.interval
	 */
	pacemaker(fn: Function, context: any, delay?: number): void;

	stop(): void;

	getStatus(): boolean;

	getConfig(): ScheduledConfig;

	//获取cron模拟测试结果
	//default cron = this.cron, count = 1
	getCronSimulationResults(info: { cron?: string; count?: number }): Date[];
}
