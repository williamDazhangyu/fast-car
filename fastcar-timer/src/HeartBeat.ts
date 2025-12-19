import { Timezone } from "tz-offset";
import { Cron } from "croner";
import { TimeUnit, TimeUnitNum } from "./ConstantTime";

export type ScheduledConfig = {
	initialDelay?: number; //初始化后第一次延迟多久后执行
	fixedRate?: number; //间隔时长 当为字符串时 代表的是cron格式
	fixedRateString?: TimeUnit; //间隔单位 默认毫秒
	cron?: string; // corn表达式
	timezone?: Timezone;
};

export type ScheduledConfigInterval = {
	initialDelay?: number; //初始化后第一次延迟多久后执行
	fixedRate?: number; //间隔时长 当为字符串时 代表的是cron格式
	fixedRateString?: TimeUnit; //间隔单位 默认毫秒
};

export type ScheduledConfigCron = {
	initialDelay?: number; //初始化后第一次延迟多久后执行
	cron?: string; // corn表达式
	timezone?: Timezone;
};

export type TZ = Timezone;

export class Heartbeat {
	diff!: number; //间隔时长
	timerId: any;
	task!: Cron;
	lastTime!: number; //间隔时长
	status: boolean;

	interval!: number;
	cron!: string;
	initialDelay!: number; //毫秒数
	timezone: Timezone;

	originalConfig: ScheduledConfig;

	//获取间隔时长
	private getInterval(fixedRate = 1000, fixedRateString = TimeUnit.millisecond) {
		let inteval = TimeUnitNum[fixedRateString];
		return fixedRate * inteval;
	}

	constructor({ fixedRate = 1000, fixedRateString = TimeUnit.millisecond, initialDelay = 0, cron, timezone = "Asia/Shanghai" }: ScheduledConfig) {
		this.status = false;
		this.timezone = timezone;
		this.initialDelay = initialDelay;

		//优先采用cron
		if (cron) {
			//默认为cron格式
			this.cron = cron;
			this.task = new Cron(cron, { timezone });
			this.originalConfig = {
				initialDelay,
				cron,
				timezone,
			};
		} else {
			//开启间隔时长模式
			this.interval = this.getInterval(fixedRate, fixedRateString);
			this.originalConfig = {
				fixedRate,
				fixedRateString,
				initialDelay,
			};
		}
	}

	//开启任务
	start(fn: Function | string, context: any) {
		const self = this;
		self.lastTime = Date.now();

		if (this.cron) {
			this.timerId = setTimeout(() => {
				this.task.schedule(() => {
					self.diff = Date.now() - self.lastTime;
					self.lastTime = Date.now();

					let fun = typeof fn == "string" ? context[fn] : fn;

					Reflect.apply(fun, context, [self.diff]);
				});
			}, this.initialDelay);
		} else {
			self.pacemaker(fn, context, this.initialDelay);
		}

		return this;
	}

	pacemaker(fn: Function | string, context: any, delay: number = this.interval) {
		const self = this;
		clearTimeout(self.timerId);

		if (!self.status) {
			self.lastTime = Date.now();
			self.timerId = setTimeout(async () => {
				let timeStamp = Date.now();
				self.diff = timeStamp - self.lastTime;
				self.lastTime = timeStamp;

				try {
					let fun = typeof fn == "string" ? context[fn] : fn;
					Reflect.apply(fun, context, [self.diff]);
				} catch (e) {
					console.error("error", e);
				}

				self.pacemaker(fn, context);
			}, delay);
		}
	}

	pause() {
		if (this.timerId) {
			clearTimeout(this.timerId);
			Reflect.deleteProperty(this, "timerId");
		}

		if (Reflect.has(this, "task")) {
			process.nextTick(() => {
				this.task?.stop();
				Reflect.deleteProperty(this, "task");
			});
		}
	}

	stop() {
		this.pause();
		this.status = true;
	}

	getStatus(): boolean {
		return this.status;
	}

	getConfig(): ScheduledConfig {
		return this.originalConfig;
	}

	//获取cron模拟测试结果
	getCronSimulationResults({ cron = this.cron, count = 1 }: { cron?: string; count?: number }): Date[] {
		if (!cron) {
			return [];
		}

		return new Cron(this.cron).enumerate(count);
	}
}
