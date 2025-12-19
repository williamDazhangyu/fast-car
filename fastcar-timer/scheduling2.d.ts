import { Heartbeat, ScheduledConfigCron, ScheduledConfigInterval } from "./src/HeartBeat";

type RetProperty = (target: any, methodName: string, descriptor: PropertyDescriptor) => void;

export function EnableScheduling(target: any): any;

//开启定时任务按照间隔方式
export function ScheduledInterval(s: ScheduledConfigInterval): RetProperty;

//开启定时任务按照cron方式
export function ScheduledCron(s: ScheduledConfigCron): RetProperty;

export function getHeartbeat(target: any, methodName: string): Heartbeat | undefined;

export function destoryHeartbet(target: any, methodName: string): void;

export function destoryHeartbetAll(target: any): void;
