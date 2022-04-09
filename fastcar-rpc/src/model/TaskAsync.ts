import { AsyncResource } from "async_hooks";
import { RpcResponseType } from "../types/RpcConfig";

class TaskAsync extends AsyncResource {
	protected callback: any;

	constructor(callback: any) {
		super("TaskAsync");
		this.callback = callback;
	}

	done(err: RpcResponseType | Error | null, result?: any) {
		this.runInAsyncScope(this.callback, null, err, result);
		this.emitDestroy();
	}
}

export default TaskAsync;
