import { EventEmitter } from "events";
import { TaskSyncType, TaskType } from "./src/type/TaskType";
export * from "./src/type/TaskType";

export class WorkerPool extends EventEmitter {
	//numThreads 默认为本机的最大线程数
	constructor(numThreads?: number, scripts?: string | URL, workerData?: any);

	private addNewWorker(scripts?: string | URL, workerData?: any): void;

	static getDefaultThreads(): number;

	runTask(task: TaskType): void;

	runTaskSync(taskSync: TaskSyncType): Promise<any>;

	getThreads(): number;

	close(): void;
}
