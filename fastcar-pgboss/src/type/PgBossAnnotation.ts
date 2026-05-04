import { PgBossData, PgBossScheduleOptions, PgBossSendOptions, PgBossWorkOptions } from "./PgBossConfig";

export type PgBossWorkerMeta = {
	queue: string;
	methodName: string;
	source?: string;
	options?: PgBossWorkOptions;
	batch?: boolean;
};

export type PgBossScheduleMeta = {
	queue: string;
	methodName: string;
	cron: string;
	source?: string;
	data?: PgBossData;
	options?: PgBossScheduleOptions;
	sendOptions?: PgBossSendOptions;
};
