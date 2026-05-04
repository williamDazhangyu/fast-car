import "reflect-metadata";
import { ApplicationStart, ApplicationStop, Autowired, BeanName, Log } from "@fastcar/core/annotation";
import { BootPriority, FastCarApplication, Logger } from "@fastcar/core";
import { PGBOSS_SCHEDULE_METADATA, PGBOSS_WORK_METADATA } from "./constant/PgBossMetaData";
import {
	PgBossCompletionOptions,
	PgBossConstructorOptions,
	PgBossConnectionOptions,
	PgBossData,
	PgBossDb,
	PgBossFetchOptions,
	PgBossInsertOptions,
	PgBossInstance,
	PgBossJobByIdOptions,
	PgBossJobInsert,
	PgBossJob,
	PgBossJobWithMetadata,
	PgBossEventHandler,
	PgBossEventMap,
	PgBossEventName,
	PgBossQueueConfig,
	PgBossQueueOptions,
	PgBossQueueResult,
	PgBossQueueSizeOptions,
	PgBossResolvedData,
	PgBossSchedule,
	PgBossScheduleConfig,
	PgBossScheduleOptions,
	PgBossSendOptions,
	PgBossSetting,
	PgBossSourceConfig,
	PgBossSourceStatus,
	PgBossWorkHandler,
	PgBossWorkOptions,
} from "./type/PgBossConfig";
import { PgBossScheduleMeta, PgBossWorkerMeta } from "./type/PgBossAnnotation";

const PgBoss = require("pg-boss");

@ApplicationStart(BootPriority.Base, "start")
@ApplicationStop(BootPriority.Lowest, "stop")
@BeanName("PgBossManager")
class PgBossManager {
	protected sourceMap: Map<string, PgBossInstance>;
	protected defaultSource: string;
	protected workerIds: Map<string, Set<string>>;
	protected started: boolean;

	@Autowired
	protected app!: FastCarApplication;

	@Log("pgboss")
	protected sysLogger!: Logger;

	constructor() {
		this.sourceMap = new Map();
		this.workerIds = new Map();
		this.defaultSource = "default";
		this.started = false;
	}

	async start(): Promise<void> {
		if (this.started) {
			this.sysLogger.warn("PgBossManager has already started");
			return;
		}

		let config: PgBossSetting = this.app.getSetting("pgboss");
		if (!config) {
			this.sysLogger.warn("PgBoss configuration not found");
			return;
		}

		let sourceConfigs = this.normalizeConfig(config);
		try {
			for (let item of sourceConfigs) {
				await this.createBoss(item);
			}

			await this.registerAnnotationTasks();
			this.started = true;
		} catch (e) {
			await this.stop();
			this.defaultSource = "default";
			throw e;
		}
	}

	async stop(): Promise<void> {
		for (let [source, boss] of this.sourceMap) {
			try {
				await boss.stop({ graceful: true, wait: true });
			} catch (e) {
				this.sysLogger.error(`PgBoss ${source} stop error`, e);
			}
		}
		this.workerIds.clear();
		this.sourceMap.clear();
		this.started = false;
	}

	getBoss(source?: string): PgBossInstance {
		let boss = this.sourceMap.get(source || this.defaultSource);
		if (!boss) {
			throw new Error(`PgBoss source ${source || this.defaultSource} cannot be found`);
		}

		return boss;
	}

	getDefaultSource(): string {
		return this.defaultSource;
	}

	hasSource(source: string): boolean {
		return this.sourceMap.has(source);
	}

	async createQueue(name: string, options?: PgBossQueueOptions, source?: string): Promise<void> {
		await this.getBoss(source).createQueue(name, options);
	}

	async send<T = PgBossData>(name: string, data?: T, options?: PgBossSendOptions, source?: string): Promise<string | null> {
		return await this.getBoss(source).send(name, this.getJobData(data), options);
	}

	async sendAfter<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, after: number | string | Date, source?: string): Promise<string | null> {
		return await this.getBoss(source).sendAfter(name, this.getJobData(data), options || {}, after);
	}

	async sendThrottled<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, seconds: number, key?: string, source?: string): Promise<string | null> {
		if (key !== undefined) {
			return await this.getBoss(source).sendThrottled(name, this.getJobData(data), options || {}, seconds, key);
		}
		return await this.getBoss(source).sendThrottled(name, this.getJobData(data), options || {}, seconds);
	}

	async sendDebounced<T = PgBossData>(name: string, data: T, options: PgBossSendOptions, seconds: number, key?: string, source?: string): Promise<string | null> {
		if (key !== undefined) {
			return await this.getBoss(source).sendDebounced(name, this.getJobData(data), options || {}, seconds, key);
		}
		return await this.getBoss(source).sendDebounced(name, this.getJobData(data), options || {}, seconds);
	}

	async insert<T = PgBossData>(jobs: PgBossJobInsert<T>[], options?: PgBossInsertOptions, source?: string): Promise<string[] | null> {
		return await this.getBoss(source).insert(jobs, options);
	}

	async fetch<T = PgBossData>(name: string, options: PgBossFetchOptions & { includeMetadata: true }, source?: string): Promise<PgBossJobWithMetadata<T>[]>;
	async fetch<T = PgBossData>(name: string, options?: PgBossFetchOptions, source?: string): Promise<PgBossJob<T>[]>;
	async fetch<T = PgBossData>(name: string, options?: PgBossFetchOptions, source?: string): Promise<Array<PgBossJob<T> | PgBossJobWithMetadata<T>>> {
		return await this.getBoss(source).fetch(name, options);
	}

	async work<T = PgBossData>(
		name: string,
		handler: PgBossWorkHandler<T>,
		options?: PgBossWorkOptions,
		source?: string
	): Promise<string> {
		let boss = this.getBoss(source);
		if (options) {
			return await boss.work(name, options, handler);
		}

		return await boss.work(name, handler);
	}

	async offWork(name: string, source?: string): Promise<void> {
		await this.getBoss(source).offWork(name);
	}

	notifyWorker(workerId: string, source?: string): void {
		this.getBoss(source).notifyWorker(workerId);
	}

	async registerWorker<T = PgBossData>(
		name: string,
		handler: PgBossWorkHandler<T>,
		options?: PgBossWorkOptions,
		source?: string
	): Promise<string> {
		await this.createQueue(name, undefined, source);
		let workerId = await this.work(name, handler, options, source);
		this.addWorkerId(source || this.defaultSource, workerId);
		return workerId;
	}

	async stopWorker(workerId: string, source?: string): Promise<void> {
		let workerSource = source || this.findWorkerSource(workerId);
		if (!workerSource) {
			return;
		}

		await this.getBoss(workerSource).offWork({ id: workerId });
		this.removeWorkerId(workerSource, workerId);
	}

	async stopWorkers(source?: string): Promise<void> {
		let sources = source ? [source] : Array.from(this.workerIds.keys());
		for (let item of sources) {
			let ids = Array.from(this.workerIds.get(item) || []);
			for (let workerId of ids) {
				await this.stopWorker(workerId, item);
			}
		}
	}

	getWorkerIds(source?: string): string[] {
		if (source) {
			return Array.from(this.workerIds.get(source) || []);
		}

		return Array.from(this.workerIds.values()).flatMap((ids) => Array.from(ids));
	}

	notifyWorkers(source?: string): void {
		for (let workerId of this.getWorkerIds(source)) {
			this.notifyWorker(workerId, source || this.findWorkerSource(workerId));
		}
	}

	on<T extends PgBossEventName>(event: T, handler: PgBossEventHandler<PgBossEventMap[T]>, source?: string): this;
	on(event: string, handler: PgBossEventHandler, source?: string): this;
	on(event: string, handler: PgBossEventHandler, source?: string): this {
		this.getBoss(source).on(event, handler);
		return this;
	}

	off<T extends PgBossEventName>(event: T, handler: PgBossEventHandler<PgBossEventMap[T]>, source?: string): this;
	off(event: string, handler: PgBossEventHandler, source?: string): this;
	off(event: string, handler: PgBossEventHandler, source?: string): this {
		this.getBoss(source).off(event, handler);
		return this;
	}

	async subscribe(event: string, name: string, source?: string): Promise<void> {
		await this.getBoss(source).subscribe(event, name);
	}

	async unsubscribe(event: string, name: string, source?: string): Promise<void> {
		await this.getBoss(source).unsubscribe(event, name);
	}

	async publish<T = PgBossData>(event: string, data?: T, options?: PgBossSendOptions, source?: string): Promise<void> {
		await this.getBoss(source).publish(event, this.getJobData(data), options);
	}

	async schedule<T = PgBossData>(name: string, cron: string, data?: T, options?: PgBossScheduleOptions, source?: string): Promise<void> {
		await this.getBoss(source).schedule(name, cron, this.getJobData(data), options);
	}

	async unschedule(name: string, source?: string): Promise<void> {
		await this.getBoss(source).unschedule(name);
	}

	async registerSchedule<T = PgBossData>(name: string, cron: string, data?: T, options?: PgBossScheduleOptions, source?: string): Promise<void> {
		await this.createQueue(name, undefined, source);
		await this.schedule(name, cron, data, options, source);
	}

	async triggerSchedule<T = PgBossData>(name: string, data?: T, options?: PgBossSendOptions, source?: string): Promise<string | null> {
		return await this.send(name, data, options, source);
	}

	async cancelSchedule(name: string, source?: string): Promise<void> {
		await this.unschedule(name, source);
	}

	async getSchedules(source?: string): Promise<PgBossSchedule[]> {
		return await this.getBoss(source).getSchedules();
	}

	listSources(): string[] {
		return Array.from(this.sourceMap.keys());
	}

	async getSourceStatus(source?: string): Promise<PgBossSourceStatus> {
		let sourceName = source || this.defaultSource;
		let status: PgBossSourceStatus = {
			source: sourceName,
			default: sourceName == this.defaultSource,
			started: this.sourceMap.has(sourceName),
		};

		if (!status.started) {
			return status;
		}

		try {
			status.installed = await this.isInstalled(sourceName);
			status.schemaVersion = Number(await this.schemaVersion(sourceName));
		} catch (e) {
			status.error = e as Error;
		}

		return status;
	}

	async getSourceStatuses(): Promise<PgBossSourceStatus[]> {
		let result: PgBossSourceStatus[] = [];
		for (let source of this.listSources()) {
			result.push(await this.getSourceStatus(source));
		}
		return result;
	}

	async healthCheck(source?: string): Promise<boolean> {
		let status = await this.getSourceStatus(source);
		return status.started && status.installed === true && status.error === undefined;
	}

	async cancel(name: string, ids: string | string[], options?: PgBossCompletionOptions, source?: string): Promise<void> {
		await this.getBoss(source).cancel(name, ids, options);
	}

	async resume(name: string, ids: string | string[], options?: PgBossCompletionOptions, source?: string): Promise<void> {
		await this.getBoss(source).resume(name, ids, options);
	}

	async retry(name: string, ids: string | string[], options?: PgBossCompletionOptions, source?: string): Promise<void> {
		await this.getBoss(source).retry(name, ids, options);
	}

	async deleteJob(name: string, ids: string | string[], options?: PgBossCompletionOptions, source?: string): Promise<void> {
		await this.getBoss(source).deleteJob(name, ids, options);
	}

	async complete<T = PgBossData>(name: string, ids: string | string[], data?: T, options?: PgBossCompletionOptions, source?: string): Promise<void> {
		let args = this.normalizeCompletionArgs(data, options, source);
		if (args.hasData) {
			await this.getBoss(args.source).complete(name, ids, args.data, args.options);
			return;
		}

		await this.getBoss(args.source).complete(name, ids, args.options);
	}

	async fail<T = PgBossData>(name: string, ids: string | string[], data?: T, options?: PgBossCompletionOptions, source?: string): Promise<void> {
		let args = this.normalizeCompletionArgs(data, options, source);
		if (args.hasData) {
			await this.getBoss(args.source).fail(name, ids, args.data, args.options);
			return;
		}

		await this.getBoss(args.source).fail(name, ids, args.options);
	}

	async getJobById<T = PgBossData>(name: string, id: string, options?: PgBossJobByIdOptions, source?: string): Promise<PgBossJobWithMetadata<T> | null> {
		return await this.getBoss(source).getJobById(name, id, options);
	}

	async updateQueue(name: string, options?: PgBossQueueOptions, source?: string): Promise<void> {
		await this.getBoss(source).updateQueue(name, options);
	}

	async deleteQueue(name: string, source?: string): Promise<void> {
		await this.getBoss(source).deleteQueue(name);
	}

	async purgeQueue(name: string, source?: string): Promise<void> {
		await this.getBoss(source).purgeQueue(name);
	}

	async getQueues(source?: string): Promise<PgBossQueueResult[]> {
		return await this.getBoss(source).getQueues();
	}

	async getQueue(name: string, source?: string): Promise<PgBossQueueResult | null> {
		return await this.getBoss(source).getQueue(name);
	}

	async getQueueSize(name: string, options?: PgBossQueueSizeOptions, source?: string): Promise<number> {
		return await this.getBoss(source).getQueueSize(name, options);
	}

	async archive(source?: string): Promise<void> {
		await this.getBoss(source).archive();
	}

	async clearStorage(source?: string): Promise<void> {
		await this.getBoss(source).clearStorage();
	}

	async purge(source?: string): Promise<void> {
		await this.getBoss(source).purge();
	}

	async expire(source?: string): Promise<void> {
		await this.getBoss(source).expire();
	}

	async maintain(source?: string): Promise<void> {
		await this.getBoss(source).maintain();
	}

	async isInstalled(source?: string): Promise<boolean> {
		return await this.getBoss(source).isInstalled();
	}

	async schemaVersion(source?: string): Promise<number> {
		return await this.getBoss(source).schemaVersion();
	}

	getDb(source?: string): PgBossDb {
		return this.getBoss(source).getDb();
	}

	protected normalizeConfig(config: PgBossSetting): PgBossSourceConfig[] {
		let configs = Array.isArray(config) ? config : [config];
		let hasExplicitDefault = configs.some((item) => typeof item != "string" && item.default === true);
		let sourceSet = new Set<string>();
		let defaultCount = 0;
		return configs.map((item, index) => {
			if (typeof item == "string") {
				let source = index == 0 ? "default" : `source${index}`;
				let isDefault = !hasExplicitDefault && index == 0;
				this.assertUniqueSource(sourceSet, source);
				defaultCount += isDefault ? 1 : 0;
				return {
					source,
					connectionString: item,
					default: isDefault,
				};
			}

			let source = item.source || (index == 0 ? "default" : `source${index}`);
			let isDefault = item.default !== undefined ? item.default : !hasExplicitDefault && index == 0;
			this.assertUniqueSource(sourceSet, source);
			defaultCount += isDefault ? 1 : 0;
			if (defaultCount > 1) {
				throw new Error("Only one PgBoss source can be marked as default");
			}

			return Object.assign(
				{
					source,
					default: isDefault,
				},
				item
			);
		});
	}

	protected async createBoss(config: PgBossSourceConfig): Promise<void> {
		let source = config.source || "default";
		if (this.sourceMap.has(source)) {
			return;
		}

		if (config.default || this.sourceMap.size == 0) {
			this.defaultSource = source;
		}

		let bossOptions = this.toBossOptions(config);
		let boss = new PgBoss(bossOptions) as PgBossInstance;
		boss.on("error", (error: Error) => {
			this.sysLogger.error(`PgBoss ${source} error`, error);
		});

		await boss.start();
		this.sourceMap.set(source, boss);

		await this.createConfiguredQueues(boss, config.queues);
		await this.createConfiguredSchedules(boss, config.schedules);
	}

	protected toBossOptions(config: PgBossSourceConfig): PgBossConstructorOptions {
		let bossOptions = Object.assign({}, config);
		["source", "default", "queues", "schedules"].forEach((key) => Reflect.deleteProperty(bossOptions, key));
		return bossOptions;
	}

	protected async createConfiguredQueues(boss: PgBossInstance, queues: PgBossQueueConfig[] = []): Promise<void> {
		for (let item of queues) {
			await boss.createQueue(item.name, item.options);
		}
	}

	protected async createConfiguredSchedules(boss: PgBossInstance, schedules: PgBossScheduleConfig[] = []): Promise<void> {
		for (let item of schedules) {
			await boss.createQueue(item.name);
			await boss.schedule(item.name, item.cron, this.getJobData(item.data), item.options);
		}
	}

	protected async registerAnnotationTasks(): Promise<void> {
		let list = this.app.getComponentList() || [];
		for (let instance of list) {
			let component = instance as Record<string, unknown>;
			await this.registerWorkers(component);
			await this.registerSchedules(component);
		}
	}

	protected async registerWorkers(instance: Record<string, unknown>): Promise<void> {
		let list: PgBossWorkerMeta[] = Reflect.getMetadata(PGBOSS_WORK_METADATA, instance) || [];
		for (let item of list) {
			await this.createQueue(item.queue, undefined, item.source);
			let workerId = await this.work(
				item.queue,
				async (jobs: PgBossJob | PgBossJob[]) => {
					if (item.batch) {
						await this.callComponentMethod(instance, item.methodName, jobs);
						return;
					}

					let jobList = Array.isArray(jobs) ? jobs : [jobs];
					for (let job of jobList) {
						await this.callComponentMethod(instance, item.methodName, job);
					}
				},
				item.options,
				item.source
			);
			if (workerId) {
				this.addWorkerId(item.source || this.defaultSource, workerId);
			}
		}
	}

	protected async registerSchedules(instance: Record<string, unknown>): Promise<void> {
		let list: PgBossScheduleMeta[] = Reflect.getMetadata(PGBOSS_SCHEDULE_METADATA, instance) || [];
		for (let item of list) {
			await this.createQueue(item.queue, undefined, item.source);
			await this.schedule(item.queue, item.cron, this.getJobData(item.data), this.mergeOptions(item.options, item.sendOptions), item.source);
			let workerId = await this.work(
				item.queue,
				async (jobs: PgBossJob | PgBossJob[]) => {
					let jobList = Array.isArray(jobs) ? jobs : [jobs];
					for (let job of jobList) {
						await this.callComponentMethod(instance, item.methodName, job);
					}
				},
				undefined,
				item.source
			);
			if (workerId) {
				this.addWorkerId(item.source || this.defaultSource, workerId);
			}
		}
	}

	protected addWorkerId(source: string, workerId: string): void {
		let ids = this.workerIds.get(source);
		if (!ids) {
			ids = new Set();
			this.workerIds.set(source, ids);
		}

		ids.add(workerId);
	}

	protected removeWorkerId(source: string, workerId: string): void {
		let ids = this.workerIds.get(source);
		if (!ids) {
			return;
		}

		ids.delete(workerId);
		if (ids.size == 0) {
			this.workerIds.delete(source);
		}
	}

	protected findWorkerSource(workerId: string): string | undefined {
		for (let [source, ids] of this.workerIds) {
			if (ids.has(workerId)) {
				return source;
			}
		}
		return undefined;
	}

	protected getJobData<T = PgBossData>(data: T | undefined): PgBossResolvedData<T> {
		return data === undefined ? {} : data;
	}

	protected async callComponentMethod(instance: Record<string, unknown>, methodName: string, arg: unknown): Promise<unknown> {
		let method = instance[methodName];
		if (typeof method != "function") {
			throw new Error(`PgBoss component method ${methodName} cannot be found`);
		}

		return await Promise.resolve(method.call(instance, arg));
	}

	protected mergeOptions(...items: Array<(PgBossScheduleOptions | PgBossSendOptions) | undefined>): PgBossScheduleOptions | undefined {
		let result = Object.assign({}, ...items.filter(Boolean));
		return Object.keys(result).length == 0 ? undefined : result;
	}

	protected assertUniqueSource(sourceSet: Set<string>, source: string): void {
		if (sourceSet.has(source)) {
			throw new Error(`Duplicate PgBoss source ${source}`);
		}
		sourceSet.add(source);
	}

	protected normalizeCompletionArgs<T = PgBossData>(
		data?: T,
		options?: PgBossConnectionOptions | string,
		source?: string
	): { data?: T; options?: PgBossConnectionOptions; source?: string; hasData: boolean } {
		if (typeof options == "string" && source === undefined) {
			source = options;
			options = undefined;
		}

		if (options === undefined && this.isConnectionOptions(data)) {
			return {
				options: data as PgBossConnectionOptions,
				source,
				hasData: false,
			};
		}

		return {
			data,
			options: options as PgBossConnectionOptions | undefined,
			source,
			hasData: data !== undefined,
		};
	}

	protected isConnectionOptions(value: unknown): boolean {
		if (!value || typeof value != "object" || Array.isArray(value)) {
			return false;
		}

		let keys = Object.keys(value);
		return keys.length > 0 && keys.every((key) => key == "db");
	}
}

export default PgBossManager;
