import {
	PgBossEventHandler,
	PgBossManager,
	PgBossMonitorStates,
	PgBossResolvedData,
	PgBossScheduleMeta,
	PgBossWorker,
} from "../src";

declare const boss: PgBossManager;

boss.on("error", (error) => {
	let message: string = error.message;
	void message;
});

boss.on("wip", (workers) => {
	let worker: PgBossWorker | undefined = workers[0];
	void worker?.id;
});

boss.on("monitor-states", (states) => {
	let monitorStates: PgBossMonitorStates = states;
	void monitorStates.queues;
});

boss.on("maintenance", () => undefined);
boss.on("stopped", () => undefined);
boss.on("custom-event", (...args) => {
	let values: unknown[] = args;
	void values;
});

const errorHandler: PgBossEventHandler<[Error]> = (error) => {
	void error.stack;
};

boss.off("error", errorHandler);

boss.registerWorker<{ id: string }>("typed.worker", async (jobs) => {
	let id: string = jobs[0].data.id;
	void id;
});

const scheduleMetaWithScalarPayload: PgBossScheduleMeta = {
	queue: "feature.flag",
	methodName: "handle",
	cron: "*/5 * * * *",
	data: false,
};

void scheduleMetaWithScalarPayload;

let resolvedData: PgBossResolvedData<boolean> = false;
resolvedData = {};
void resolvedData;
