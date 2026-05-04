import { PgBossData, PgBossScheduleOptions, PgBossSendOptions, PgBossWorkOptions } from ".";

export function EnablePgBoss(target: Function): void;

export function PgBossWork(queue: string, options?: PgBossWorkOptions & { source?: string; batch?: boolean }): MethodDecorator;

export function PgBossSchedule(
	queue: string,
	cron: string,
	options?: PgBossScheduleOptions & {
		source?: string;
		data?: PgBossData;
		sendOptions?: PgBossSendOptions;
	}
): MethodDecorator;
