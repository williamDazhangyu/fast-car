import { AsyncResource } from "async_hooks";

type MethodType = (...args: any[]) => any;

export default class WorkerPoolTask extends AsyncResource {
	private callback: (...args: any[]) => any;

	constructor(callback: MethodType) {
		super("WorkerPoolTaskInfo");
		this.callback = callback;
	}

	done(err: Error | null, result?: any) {
		this.runInAsyncScope(this.callback, null, err, result);
		this.emitDestroy();
	}
}
