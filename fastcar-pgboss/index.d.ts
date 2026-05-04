import type PgBoss = require("pg-boss");

export type PgBossConstructorOptions = PgBoss.ConstructorOptions;

export type PgBossData = unknown;

export type PgBossResolvedData<T = PgBossData> = T | Record<string, never>;

export type PgBossInstance = {
	on<T extends PgBossEventName>(event: T, handler: PgBossEventHandler<PgBossEventMap[T]>): PgBossInstance;
	on(event: string, handler: PgBossEventHandler): PgBossInstance;
	off<T extends PgBossEventName>(event: T, handler: PgBossEventHandler<PgBossEventMap[T]>): PgBossInstance;
	off(event: string, handler: PgBossEventHandler): PgBossInstance;
	start(): Promise<PgBossInstance>;
	stop(options?: PgBoss.StopOptions): Promise<void>;
	createQueue(name: string, options?: PgBossQueueOptions): Promise<void>;
	updateQueue(name: string, options?: PgBossQueueOptions): Promise<void>;
	deleteQueue(name: string): Promise<void>;
	purgeQueue(name: string): Promise<void>;
	getQueues(): Promise<PgBossQueueResult[]>;
	getQueue(name: string): Promise<PgBossQueueResult | null>;
	getQueueSize(name: string, options?: PgBossQueueSizeOptions): Promise<number>;
	send<T = PgBossData>(name: string, data: T, options?: PgBossSendOptions): Promise<string | null>;
	sendAfter<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, after: number | string | Date): Promise<string | null>;
	sendThrottled<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, seconds: number, key?: string): Promise<string | null>;
	sendDebounced<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, seconds: number, key?: string): Promise<string | null>;
	insert<T = PgBossData>(jobs: PgBossJobInsert<T>[], options?: PgBossInsertOptions): Promise<string[] | null>;
	fetch<T = PgBossData>(name: string, options: PgBossFetchOptions & { includeMetadata: true }): Promise<PgBossJobWithMetadata<T>[]>;
	fetch<T = PgBossData>(name: string, options?: PgBossFetchOptions): Promise<PgBossJob<T>[]>;
	work<T = PgBossData>(name: string, handler: PgBossWorkHandler<T>): Promise<string>;
	work<T = PgBossData>(name: string, options: PgBossWorkOptions, handler: PgBossWorkHandler<T>): Promise<string>;
	offWork(name: string | PgBoss.OffWorkOptions): Promise<void>;
	notifyWorker(workerId: string): void;
	subscribe(event: string, name: string): Promise<void>;
	unsubscribe(event: string, name: string): Promise<void>;
	publish<T = PgBossData>(event: string, data?: T, options?: PgBossSendOptions): Promise<void>;
	schedule<T = PgBossData>(name: string, cron: string, data?: T, options?: PgBossScheduleOptions): Promise<void>;
	unschedule(name: string): Promise<void>;
	getSchedules(): Promise<PgBossSchedule[]>;
	cancel(name: string, ids: string | string[], options?: PgBossCompletionOptions): Promise<void>;
	resume(name: string, ids: string | string[], options?: PgBossCompletionOptions): Promise<void>;
	retry(name: string, ids: string | string[], options?: PgBossCompletionOptions): Promise<void>;
	deleteJob(name: string, ids: string | string[], options?: PgBossCompletionOptions): Promise<void>;
	complete<T = PgBossData>(name: string, ids: string | string[], data?: T, options?: PgBossCompletionOptions): Promise<void>;
	fail<T = PgBossData>(name: string, ids: string | string[], data?: T, options?: PgBossCompletionOptions): Promise<void>;
	getJobById<T = PgBossData>(name: string, id: string, options?: PgBossJobByIdOptions): Promise<PgBossJobWithMetadata<T> | null>;
	clearStorage(): Promise<void>;
	archive(): Promise<void>;
	purge(): Promise<void>;
	expire(): Promise<void>;
	maintain(): Promise<void>;
	isInstalled(): Promise<boolean>;
	schemaVersion(): Promise<number>;
	getDb(): PgBossDb;
};

export type PgBossDb = PgBoss.Db;

export type PgBossQueueOptions = Omit<PgBoss.Queue, "name">;

export type PgBossQueueResult = PgBoss.QueueResult;

export type PgBossQueueConfig = {
	name: string;
	options?: PgBossQueueOptions;
};

export type PgBossScheduleConfig<T = PgBossData> = {
	name: string;
	cron: string;
	data?: T;
	options?: PgBossScheduleOptions;
};

export type PgBossSourceConfig = PgBossConstructorOptions & {
	source?: string;
	default?: boolean;
	queues?: PgBossQueueConfig[];
	schedules?: PgBossScheduleConfig[];
};

export type PgBossSetting = string | PgBossSourceConfig | Array<string | PgBossSourceConfig>;

export type PgBossWorkOptions = PgBoss.WorkOptions;

export type PgBossSendOptions = PgBoss.SendOptions;

export type PgBossScheduleOptions = PgBoss.ScheduleOptions;

export type PgBossFetchOptions = PgBoss.FetchOptions;

export type PgBossConnectionOptions = PgBoss.ConnectionOptions;

export type PgBossInsertOptions = PgBoss.InsertOptions;

export type PgBossQueueSizeOptions = { before: "retry" | "active" | "completed" | "cancelled" | "failed" };

export type PgBossJobInsert<T = PgBossData> = PgBoss.JobInsert<T>;

export type PgBossJob<T = PgBossData> = PgBoss.Job<T>;

export type PgBossJobWithMetadata<T = PgBossData> = PgBoss.JobWithMetadata<T>;

export type PgBossSchedule = PgBoss.Schedule;

export type PgBossWorker = PgBoss.Worker;

export type PgBossMonitorStates = PgBoss.MonitorStates;

export type PgBossEventHandler<Args extends unknown[] = unknown[]> = {
	bivarianceHack(...args: Args): void;
}["bivarianceHack"];

export type PgBossEventMap = {
	error: [Error];
	maintenance: [];
	"monitor-states": [PgBossMonitorStates];
	wip: [PgBossWorker[]];
	stopped: [];
};

export type PgBossEventName = keyof PgBossEventMap;

export type PgBossWorkHandler<T = PgBossData> = (jobs: PgBossJob<T>[] | PgBossJobWithMetadata<T>[]) => Promise<unknown> | unknown;

export type PgBossCompletionOptions = PgBossConnectionOptions;

export type PgBossJobByIdOptions = PgBossConnectionOptions & { includeArchive?: boolean };

export type PgBossSourceStatus = {
	source: string;
	default: boolean;
	started: boolean;
	installed?: boolean;
	schemaVersion?: number;
	error?: Error;
};

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

export class PgBossManager {
	start(): Promise<void>;

	stop(): Promise<void>;

	getBoss(source?: string): PgBossInstance;

	getDefaultSource(): string;

	hasSource(source: string): boolean;

	createQueue(name: string, options?: PgBossQueueOptions, source?: string): Promise<void>;

	send<T = PgBossData>(name: string, data?: T, options?: PgBossSendOptions, source?: string): Promise<string | null>;

	sendAfter<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, after: number | string | Date, source?: string): Promise<string | null>;

	sendThrottled<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, seconds: number, key?: string, source?: string): Promise<string | null>;

	sendDebounced<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, seconds: number, key?: string, source?: string): Promise<string | null>;

	insert<T = PgBossData>(jobs: PgBossJobInsert<T>[], options?: PgBossInsertOptions, source?: string): Promise<string[] | null>;

	fetch<T = PgBossData>(name: string, options: PgBossFetchOptions & { includeMetadata: true }, source?: string): Promise<PgBossJobWithMetadata<T>[]>;
	fetch<T = PgBossData>(name: string, options?: PgBossFetchOptions, source?: string): Promise<PgBossJob<T>[]>;

	work<T = PgBossData>(
		name: string,
		handler: PgBossWorkHandler<T>,
		options?: PgBossWorkOptions,
		source?: string
	): Promise<string>;

	offWork(name: string, source?: string): Promise<void>;

	notifyWorker(workerId: string, source?: string): void;

	registerWorker<T = PgBossData>(
		name: string,
		handler: PgBossWorkHandler<T>,
		options?: PgBossWorkOptions,
		source?: string
	): Promise<string>;

	stopWorker(workerId: string, source?: string): Promise<void>;

	stopWorkers(source?: string): Promise<void>;

	getWorkerIds(source?: string): string[];

	notifyWorkers(source?: string): void;

	on<T extends PgBossEventName>(event: T, handler: PgBossEventHandler<PgBossEventMap[T]>, source?: string): this;
	on(event: string, handler: PgBossEventHandler, source?: string): this;

	off<T extends PgBossEventName>(event: T, handler: PgBossEventHandler<PgBossEventMap[T]>, source?: string): this;
	off(event: string, handler: PgBossEventHandler, source?: string): this;

	subscribe(event: string, name: string, source?: string): Promise<void>;

	unsubscribe(event: string, name: string, source?: string): Promise<void>;

	publish<T = PgBossData>(event: string, data?: T, options?: PgBossSendOptions, source?: string): Promise<void>;

	schedule<T = PgBossData>(name: string, cron: string, data?: T, options?: PgBossScheduleOptions, source?: string): Promise<void>;

	unschedule(name: string, source?: string): Promise<void>;

	registerSchedule<T = PgBossData>(name: string, cron: string, data?: T, options?: PgBossScheduleOptions, source?: string): Promise<void>;

	triggerSchedule<T = PgBossData>(name: string, data?: T, options?: PgBossSendOptions, source?: string): Promise<string | null>;

	cancelSchedule(name: string, source?: string): Promise<void>;

	getSchedules(source?: string): Promise<PgBossSchedule[]>;

	listSources(): string[];

	getSourceStatus(source?: string): Promise<PgBossSourceStatus>;

	getSourceStatuses(): Promise<PgBossSourceStatus[]>;

	healthCheck(source?: string): Promise<boolean>;

	cancel(name: string, ids: string | string[], options?: PgBossCompletionOptions, source?: string): Promise<void>;

	resume(name: string, ids: string | string[], options?: PgBossCompletionOptions, source?: string): Promise<void>;

	retry(name: string, ids: string | string[], options?: PgBossCompletionOptions, source?: string): Promise<void>;

	deleteJob(name: string, ids: string | string[], options?: PgBossCompletionOptions, source?: string): Promise<void>;

	complete<T = PgBossData>(name: string, ids: string | string[], data?: T, options?: PgBossCompletionOptions, source?: string): Promise<void>;

	fail<T = PgBossData>(name: string, ids: string | string[], data?: T, options?: PgBossCompletionOptions, source?: string): Promise<void>;

	getJobById<T = PgBossData>(name: string, id: string, options?: PgBossJobByIdOptions, source?: string): Promise<PgBossJobWithMetadata<T> | null>;

	updateQueue(name: string, options?: PgBossQueueOptions, source?: string): Promise<void>;

	deleteQueue(name: string, source?: string): Promise<void>;

	purgeQueue(name: string, source?: string): Promise<void>;

	getQueues(source?: string): Promise<PgBossQueueResult[]>;

	getQueue(name: string, source?: string): Promise<PgBossQueueResult | null>;

	getQueueSize(name: string, options?: PgBossQueueSizeOptions, source?: string): Promise<number>;

	archive(source?: string): Promise<void>;

	clearStorage(source?: string): Promise<void>;

	purge(source?: string): Promise<void>;

	expire(source?: string): Promise<void>;

	maintain(source?: string): Promise<void>;

	isInstalled(source?: string): Promise<boolean>;

	schemaVersion(source?: string): Promise<number>;

	getDb(source?: string): PgBossDb;

	protected normalizeConfig(config: PgBossSetting): PgBossSourceConfig[];

	protected getJobData<T = PgBossData>(data: T | undefined): PgBossResolvedData<T>;

	protected mergeOptions(...items: Array<(PgBossScheduleOptions | PgBossSendOptions) | undefined>): PgBossScheduleOptions | undefined;
}
