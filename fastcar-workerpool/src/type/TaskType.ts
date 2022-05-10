export type TaskType = {
	task?: (...args: any) => any;
	args: any[];
	cb: (err: Error, res: any) => any;
};

export type TaskSyncType = {
	task?: (...args: any) => any;
	args: any[];
};
