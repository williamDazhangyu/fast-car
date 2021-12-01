declare type ScheduledConfigInterval = {
	initialDelay?: number; //初始化后第一次延迟多久后执行
	fixedRate?: number; //间隔时长 当为字符串时 代表的是cron格式
	fixedRateString?: TimeUnit; //间隔单位 默认毫秒
};

declare type ScheduledConfigCron = {
	initialDelay?: number; //初始化后第一次延迟多久后执行
	cron?: string; // corn表达式
	timezone?: string;
};

type Ret = (target: any) => void;
type RetProperty = (target: any, methodName: string, descriptor: PropertyDescriptor) => void;

export enum TimeUnit {
	millisecond = "millisecond",
	second = "second",
	minute = "minute",
	hour = "hour",
	day = "day",
	month = "month",
	year = "year",
}

export enum TimeUnitNum {
	millisecond = 1,
	second = 1000,
	minute = 1000 * 60,
	hour = 1000 * 60 * 60,
	day = 1000 * 60 * 60 * 24,
	month = 1000 * 60 * 60 * 24 * 30,
	year = 1000 * 60 * 60 * 24 * 365,
}

//作用于类上用于是否开启定时状态任务
export function EnableScheduling(target: any): Ret;

//开启定时任务按照间隔方式
export function ScheduledInterval(s: ScheduledConfigInterval): RetProperty;

//开启定时任务按照cron方式
export function ScheduledCron(s: ScheduledConfigCron): RetProperty;
