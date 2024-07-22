import { EventEmitter } from "events";
import { Worker } from "worker_threads";
import { Log } from "@fastcar/core/annotation";
import { Logger } from "@fastcar/core";
import { TaskSyncType, TaskType } from "./type/TaskType";
import WorkerPoolTask from "./WorkerPoolTask";

const kTaskInfo = Symbol("kTaskInfo");
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent");

/**
 * @version 1.0 轻量级线程池
 */
export default class WorkerPool extends EventEmitter {
	private numThreads: number;
	private workers: Worker[];
	private freeWorkers: Worker[];
	private tasks: TaskType[];

	@Log("sys")
	private logger!: Logger;

	constructor({ numThreads = WorkerPool.getDefaultThreads(), scripts, workerData }: { numThreads?: number; scripts?: string | URL; workerData?: any } = {}) {
		super();
		this.numThreads = numThreads;
		this.workers = [];
		this.freeWorkers = [];
		this.tasks = [];

		for (let i = 0; i < this.numThreads; i++) {
			this.addNewWorker(scripts, workerData);
		}

		this.on(kWorkerFreedEvent, () => {
			if (this.tasks.length == 0) {
				return;
			}

			let taskInfo = this.tasks.shift();
			if (taskInfo) {
				let { task, cb, args } = taskInfo;
				const worker = this.freeWorkers.pop();
				if (worker) {
					Reflect.set(worker, kTaskInfo, new WorkerPoolTask(cb));
					if (task) {
						worker.postMessage({ task: task.toString(), args });
					} else {
						worker.postMessage({ args });
					}
				} else {
					this.tasks.unshift(taskInfo);
				}
			}
		});
	}

	private addNewWorker(scripts?: string | URL, workerData: any = {}) {
		if (!scripts) {
			scripts = require.resolve("./Worker");
		}
		const worker = new Worker(scripts, { workerData });

		worker.on("message", ({ err, res }) => {
			let workerTaskInfo: WorkerPoolTask = Reflect.get(worker, kTaskInfo);
			if (workerTaskInfo) {
				workerTaskInfo.done(err, res);
			}

			if (err) {
				this.logger.error(err);
			}

			Reflect.set(workerTaskInfo, kTaskInfo, null);
			this.freeWorkers.push(worker);
			this.emit(kWorkerFreedEvent);
		});

		worker.on("error", (err) => {
			let workerTaskInfo: WorkerPoolTask = Reflect.get(worker, kTaskInfo);
			if (workerTaskInfo) {
				workerTaskInfo.done(err);
			}

			if (err) {
				this.logger.error(err);
			}

			let index = this.workers.indexOf(worker);
			this.workers.splice(index, 1);
			this.addNewWorker(scripts, workerData);
		});

		this.workers.push(worker);
		this.freeWorkers.push(worker);
		this.emit(kWorkerFreedEvent);
	}

	static getDefaultThreads() {
		const os = require("os");
		return os.cpus().length;
	}

	runTask(task: TaskType) {
		this.tasks.push(task);

		if (this.freeWorkers.length === 0) {
			return;
		}

		this.emit(kWorkerFreedEvent);
	}

	runTaskSync(taskSync: TaskSyncType): Promise<any> {
		return new Promise((resolve, reject) => {
			let tmpTask: TaskType = {
				task: taskSync.task,
				args: taskSync.args,
				cb: (err, res) => {
					err ? reject(err) : resolve(res);
				},
			};

			this.runTask(tmpTask);
		});
	}

	getThreads() {
		return this.numThreads;
	}

	close() {
		if (this.freeWorkers.length < this.numThreads) {
			this.logger.warn("The task has not been fully completed");
		}

		for (const worker of this.workers) {
			worker.terminate();
		}
	}
}
