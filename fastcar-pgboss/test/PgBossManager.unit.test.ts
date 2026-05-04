import "reflect-metadata";
import * as assert from "assert";
import Module = require("module");

type Call = {
	method: string;
	args: any[];
};

const originalLoad = (Module as any)._load;
const bossInstances: MockPgBoss[] = [];
let failStartForConnectionString: string | undefined;

class MockPgBoss {
	options: any;
	calls: Call[] = [];
	handlers: Map<string, Function> = new Map();

	constructor(options: any) {
		this.options = options;
		bossInstances.push(this);
	}

	on(...args: any[]) {
		this.calls.push({ method: "on", args });
		return this;
	}

	off(...args: any[]) {
		this.calls.push({ method: "off", args });
		return this;
	}

	async start() {
		this.calls.push({ method: "start", args: [] });
		if (this.options.connectionString == failStartForConnectionString) {
			throw new Error(`start failed for ${this.options.connectionString}`);
		}
		return this;
	}

	async stop(...args: any[]) {
		this.calls.push({ method: "stop", args });
	}

	async isInstalled(...args: any[]) {
		this.calls.push({ method: "isInstalled", args });
		return true;
	}

	async schemaVersion(...args: any[]) {
		this.calls.push({ method: "schemaVersion", args });
		return 42;
	}

	async createQueue(...args: any[]) {
		this.calls.push({ method: "createQueue", args });
	}

	async schedule(...args: any[]) {
		this.calls.push({ method: "schedule", args });
	}

	async unschedule(...args: any[]) {
		this.calls.push({ method: "unschedule", args });
	}

	async send(...args: any[]) {
		this.calls.push({ method: "send", args });
		return "job-id";
	}

	async sendAfter(...args: any[]) {
		this.calls.push({ method: "sendAfter", args });
		return "job-id";
	}

	async sendThrottled(...args: any[]) {
		this.calls.push({ method: "sendThrottled", args });
		return "job-id";
	}

	async sendDebounced(...args: any[]) {
		this.calls.push({ method: "sendDebounced", args });
		return "job-id";
	}

	async publish(...args: any[]) {
		this.calls.push({ method: "publish", args });
	}

	async work(...args: any[]) {
		this.calls.push({ method: "work", args });
		let queue = args[0];
		let handler = typeof args[1] == "function" ? args[1] : args[2];
		this.handlers.set(queue, handler);
		return `${queue}-worker`;
	}

	async offWork(...args: any[]) {
		this.calls.push({ method: "offWork", args });
	}

	notifyWorker(...args: any[]) {
		this.calls.push({ method: "notifyWorker", args });
	}

	async fetch(...args: any[]) {
		this.calls.push({ method: "fetch", args });
		return args[1]?.includeMetadata ? [{ id: "job-1", state: "active", data: { id: 1 } }] : [];
	}

	async complete(...args: any[]) {
		this.calls.push({ method: "complete", args });
	}

	async fail(...args: any[]) {
		this.calls.push({ method: "fail", args });
	}

	async insert(...args: any[]) {
		this.calls.push({ method: "insert", args });
		return ["job-1", "job-2"];
	}

	async cancel(...args: any[]) {
		this.calls.push({ method: "cancel", args });
	}

	async resume(...args: any[]) {
		this.calls.push({ method: "resume", args });
	}

	async retry(...args: any[]) {
		this.calls.push({ method: "retry", args });
	}

	async deleteJob(...args: any[]) {
		this.calls.push({ method: "deleteJob", args });
	}

	async getJobById(...args: any[]) {
		this.calls.push({ method: "getJobById", args });
		return { id: args[1], name: args[0], data: { ok: true }, state: "completed" };
	}

	async updateQueue(...args: any[]) {
		this.calls.push({ method: "updateQueue", args });
	}

	async deleteQueue(...args: any[]) {
		this.calls.push({ method: "deleteQueue", args });
	}

	async purgeQueue(...args: any[]) {
		this.calls.push({ method: "purgeQueue", args });
	}

	async getQueues(...args: any[]) {
		this.calls.push({ method: "getQueues", args });
		return [{ name: "email.send" }];
	}

	async getQueue(...args: any[]) {
		this.calls.push({ method: "getQueue", args });
		return { name: args[0] };
	}

	async getQueueSize(...args: any[]) {
		this.calls.push({ method: "getQueueSize", args });
		return 7;
	}

	async getSchedules(...args: any[]) {
		this.calls.push({ method: "getSchedules", args });
		return [{ name: "report.daily" }];
	}

	async archive(...args: any[]) {
		this.calls.push({ method: "archive", args });
	}

	async clearStorage(...args: any[]) {
		this.calls.push({ method: "clearStorage", args });
	}

	async purge(...args: any[]) {
		this.calls.push({ method: "purge", args });
	}

	async expire(...args: any[]) {
		this.calls.push({ method: "expire", args });
	}

	async maintain(...args: any[]) {
		this.calls.push({ method: "maintain", args });
	}

	getDb(...args: any[]) {
		this.calls.push({ method: "getDb", args });
		return { executeSql: async () => ({ rows: [] }) };
	}
}

function noOpClassDecorator() {
	return function(target: any) {
		return target;
	};
}

function noOpPropertyDecorator() {
	return function() {
		return undefined;
	};
}

function installMocks() {
	(Module as any)._load = function(request: string, parent: any, isMain: boolean) {
		if (request == "pg-boss") {
			return MockPgBoss;
		}

		if (request == "@fastcar/core") {
			return {
				BootPriority: {
					Base: 0,
					Sys: 1,
					Common: 2,
					Other: 3,
					Lowest: 10000,
				},
			};
		}

		if (request == "@fastcar/core/annotation") {
			return {
				ApplicationStart: noOpClassDecorator,
				ApplicationStop: noOpClassDecorator,
				BeanName: noOpClassDecorator,
				Autowired: () => undefined,
				Log: noOpPropertyDecorator,
				ComponentInjection: () => undefined,
			};
		}

		return originalLoad.apply(this, arguments as any);
	};
}

function resetMocks() {
	bossInstances.length = 0;
	failStartForConnectionString = undefined;
}

function createManager(setting: any, components: any[] = []) {
	const PgBossManager = require("../src/PgBossManager").default;
	let manager = new PgBossManager() as any;
	manager.app = {
		getSetting(key: string) {
			return key == "pgboss" ? setting : undefined;
		},
		getComponentList() {
			return components;
		},
	};
	manager.sysLogger = {
		info() {},
		debug() {},
		warn() {},
		error() {},
	};
	return manager;
}

function calls(instance: MockPgBoss, method: string) {
	return instance.calls.filter((item) => item.method == method);
}

installMocks();

describe("PgBossManager", () => {
	after(() => {
		(Module as any)._load = originalLoad;
	});

	beforeEach(() => {
		resetMocks();
	});

	it("starts configured sources and creates configured queues and schedules", async () => {
		let manager = createManager([
			{
				source: "default",
				connectionString: "postgres://default",
				schema: "boss",
				queues: [{ name: "email.send", options: { retryLimit: 2 } }],
			},
			{
				source: "audit",
				default: true,
				connectionString: "postgres://audit",
				schedules: [{ name: "audit.daily", cron: "0 1 * * *", data: false }],
			},
		]);

		await manager.start();

		assert.strictEqual(bossInstances.length, 2);
		assert.deepStrictEqual(bossInstances[0].options, {
			connectionString: "postgres://default",
			schema: "boss",
		});
		assert.deepStrictEqual(bossInstances[1].options, {
			connectionString: "postgres://audit",
		});
		assert.strictEqual(manager.getDefaultSource(), "audit");
		assert.strictEqual(calls(bossInstances[0], "start").length, 1);
		assert.deepStrictEqual(calls(bossInstances[0], "createQueue")[0].args, ["email.send", { retryLimit: 2 }]);
		assert.deepStrictEqual(calls(bossInstances[1], "schedule")[0].args, ["audit.daily", "0 1 * * *", false, undefined]);
	});

	it("proxies common pg-boss methods to the selected source", async () => {
		let manager = createManager([
			{ source: "default", connectionString: "postgres://default" },
			{ source: "audit", connectionString: "postgres://audit" },
		]);

		await manager.start();
		let id = await manager.send("email.send", { to: "a@example.com" }, { priority: 1 }, "audit");
		await manager.complete("email.send", "job-1", {}, { db: "tx" }, "audit");
		await manager.fail("email.send", "job-2", false, undefined, "audit");
		await manager.complete("email.send", "job-3", { db: "tx" }, "audit");

		assert.strictEqual(id, "job-id");
		assert.deepStrictEqual(calls(bossInstances[1], "send")[0].args, ["email.send", { to: "a@example.com" }, { priority: 1 }]);
		assert.deepStrictEqual(calls(bossInstances[1], "complete")[0].args, ["email.send", "job-1", {}, { db: "tx" }]);
		assert.deepStrictEqual(calls(bossInstances[1], "fail")[0].args, ["email.send", "job-2", false, undefined]);
		assert.deepStrictEqual(calls(bossInstances[1], "complete")[1].args, ["email.send", "job-3", { db: "tx" }]);
	});

	it("proxies queue, job, storage, and db APIs to the selected source", async () => {
		let manager = createManager([
			{ source: "default", connectionString: "postgres://default" },
			{ source: "audit", connectionString: "postgres://audit" },
		]);

		await manager.start();
		let ids = await manager.insert([{ name: "audit.job", data: { id: 1 } }], { db: "tx" }, "audit");
		let jobs = await manager.fetch("audit.job", { batchSize: 5, includeMetadata: true }, "audit");
		await manager.cancel("audit.job", ["job-1"], { db: "tx" }, "audit");
		await manager.resume("audit.job", "job-1", undefined, "audit");
		await manager.retry("audit.job", "job-1", undefined, "audit");
		await manager.deleteJob("audit.job", "job-1", undefined, "audit");
		let job = await manager.getJobById("audit.job", "job-1", { includeArchive: true }, "audit");
		await manager.updateQueue("audit.job", { retryLimit: 5 }, "audit");
		await manager.deleteQueue("audit.job", "audit");
		await manager.purgeQueue("audit.job", "audit");
		let queues = await manager.getQueues("audit");
		let queue = await manager.getQueue("audit.job", "audit");
		let size = await manager.getQueueSize("audit.job", { before: "completed" }, "audit");
		let schedules = await manager.getSchedules("audit");
		await manager.archive("audit");
		await manager.clearStorage("audit");
		await manager.purge("audit");
		await manager.expire("audit");
		await manager.maintain("audit");
		let db = manager.getDb("audit");
		let nativeBoss = manager.getBoss("audit");

		assert.deepStrictEqual(ids, ["job-1", "job-2"]);
		assert.deepStrictEqual(jobs, [{ id: "job-1", state: "active", data: { id: 1 } }]);
		assert.deepStrictEqual(job, { id: "job-1", name: "audit.job", data: { ok: true }, state: "completed" });
		assert.deepStrictEqual(queues, [{ name: "email.send" }]);
		assert.deepStrictEqual(queue, { name: "audit.job" });
		assert.strictEqual(size, 7);
		assert.deepStrictEqual(schedules, [{ name: "report.daily" }]);
		assert.strictEqual(nativeBoss, bossInstances[1]);
		assert.strictEqual(typeof db.executeSql, "function");
		assert.deepStrictEqual(calls(bossInstances[1], "insert")[0].args, [[{ name: "audit.job", data: { id: 1 } }], { db: "tx" }]);
		assert.deepStrictEqual(calls(bossInstances[1], "fetch")[0].args, ["audit.job", { batchSize: 5, includeMetadata: true }]);
		assert.deepStrictEqual(calls(bossInstances[1], "cancel")[0].args, ["audit.job", ["job-1"], { db: "tx" }]);
		assert.deepStrictEqual(calls(bossInstances[1], "resume")[0].args, ["audit.job", "job-1", undefined]);
		assert.deepStrictEqual(calls(bossInstances[1], "retry")[0].args, ["audit.job", "job-1", undefined]);
		assert.deepStrictEqual(calls(bossInstances[1], "deleteJob")[0].args, ["audit.job", "job-1", undefined]);
		assert.deepStrictEqual(calls(bossInstances[1], "getJobById")[0].args, ["audit.job", "job-1", { includeArchive: true }]);
		assert.deepStrictEqual(calls(bossInstances[1], "updateQueue")[0].args, ["audit.job", { retryLimit: 5 }]);
		assert.deepStrictEqual(calls(bossInstances[1], "deleteQueue")[0].args, ["audit.job"]);
		assert.deepStrictEqual(calls(bossInstances[1], "purgeQueue")[0].args, ["audit.job"]);
		assert.deepStrictEqual(calls(bossInstances[1], "getQueueSize")[0].args, ["audit.job", { before: "completed" }]);
		assert.strictEqual(calls(bossInstances[1], "archive").length, 1);
		assert.strictEqual(calls(bossInstances[1], "clearStorage").length, 1);
		assert.strictEqual(calls(bossInstances[1], "purge").length, 1);
		assert.strictEqual(calls(bossInstances[1], "expire").length, 1);
		assert.strictEqual(calls(bossInstances[1], "maintain").length, 1);
		assert.strictEqual(calls(bossInstances[1], "getDb").length, 1);
	});

	it("preserves falsy payloads and empty singleton keys", async () => {
		let manager = createManager({ connectionString: "postgres://default" });

		await manager.start();
		await manager.send("falsy.zero", 0);
		await manager.sendAfter("falsy.false", false, {}, 30);
		await manager.sendThrottled("falsy.empty", "", {}, 10, "");
		await manager.sendDebounced("falsy.null", null, {}, 10, "");
		await manager.publish("event.falsy", 0);
		await manager.schedule("schedule.falsy", "*/5 * * * *", false);

		assert.deepStrictEqual(calls(bossInstances[0], "send")[0].args, ["falsy.zero", 0, undefined]);
		assert.deepStrictEqual(calls(bossInstances[0], "sendAfter")[0].args, ["falsy.false", false, {}, 30]);
		assert.deepStrictEqual(calls(bossInstances[0], "sendThrottled")[0].args, ["falsy.empty", "", {}, 10, ""]);
		assert.deepStrictEqual(calls(bossInstances[0], "sendDebounced")[0].args, ["falsy.null", null, {}, 10, ""]);
		assert.deepStrictEqual(calls(bossInstances[0], "publish")[0].args, ["event.falsy", 0, undefined]);
		assert.deepStrictEqual(calls(bossInstances[0], "schedule")[0].args, ["schedule.falsy", "*/5 * * * *", false, undefined]);
	});

	it("manually registers, triggers, and cancels schedules", async () => {
		let manager = createManager([
			{ source: "default", connectionString: "postgres://default" },
			{ source: "audit", connectionString: "postgres://audit" },
		]);

		await manager.start();
		let id = await manager.triggerSchedule("audit.daily", { type: "manual" }, { priority: 1 }, "audit");
		await manager.registerSchedule("audit.daily", "0 1 * * *", { type: "daily" }, { tz: "Asia/Shanghai" }, "audit");
		await manager.cancelSchedule("audit.daily", "audit");

		assert.strictEqual(id, "job-id");
		assert.deepStrictEqual(calls(bossInstances[1], "send")[0].args, ["audit.daily", { type: "manual" }, { priority: 1 }]);
		assert.deepStrictEqual(calls(bossInstances[1], "createQueue")[0].args, ["audit.daily", undefined]);
		assert.deepStrictEqual(calls(bossInstances[1], "schedule")[0].args, ["audit.daily", "0 1 * * *", { type: "daily" }, { tz: "Asia/Shanghai" }]);
		assert.deepStrictEqual(calls(bossInstances[1], "unschedule")[0].args, ["audit.daily"]);
	});

	it("manually registers, notifies, and stops workers by worker id", async () => {
		let manager = createManager([
			{ source: "default", connectionString: "postgres://default" },
			{ source: "audit", connectionString: "postgres://audit" },
		]);

		await manager.start();
		let workerId = await manager.registerWorker("audit.work", async () => undefined, { batchSize: 2 }, "audit");

		assert.strictEqual(workerId, "audit.work-worker");
		assert.deepStrictEqual(manager.getWorkerIds("audit"), ["audit.work-worker"]);
		assert.deepStrictEqual(calls(bossInstances[1], "createQueue")[0].args, ["audit.work", undefined]);
		assert.deepStrictEqual(calls(bossInstances[1], "work")[0].args.slice(0, 2), ["audit.work", { batchSize: 2 }]);

		manager.notifyWorkers("audit");
		assert.deepStrictEqual(calls(bossInstances[1], "notifyWorker")[0].args, ["audit.work-worker"]);

		await manager.stopWorker("audit.work-worker");
		assert.deepStrictEqual(calls(bossInstances[1], "offWork")[0].args, [{ id: "audit.work-worker" }]);
		assert.deepStrictEqual(manager.getWorkerIds("audit"), []);
	});

	it("reports source statuses and health checks", async () => {
		let manager = createManager([
			{ source: "default", connectionString: "postgres://default" },
			{ source: "audit", default: true, connectionString: "postgres://audit" },
		]);

		await manager.start();

		assert.deepStrictEqual(manager.listSources(), ["default", "audit"]);
		assert.deepStrictEqual(await manager.getSourceStatus("audit"), {
			source: "audit",
			default: true,
			started: true,
			installed: true,
			schemaVersion: 42,
		});
		assert.strictEqual(await manager.healthCheck("audit"), true);
		assert.deepStrictEqual(await manager.getSourceStatus("missing"), {
			source: "missing",
			default: false,
			started: false,
		});
	});

	it("proxies pg-boss event handlers to selected source", async () => {
		let manager = createManager([
			{ source: "default", connectionString: "postgres://default" },
			{ source: "audit", connectionString: "postgres://audit" },
		]);
		let handler = () => undefined;

		await manager.start();
		assert.strictEqual(manager.on("wip", handler, "audit"), manager);
		assert.strictEqual(manager.off("wip", handler, "audit"), manager);

		assert.deepStrictEqual(calls(bossInstances[1], "on")[1].args, ["wip", handler]);
		assert.deepStrictEqual(calls(bossInstances[1], "off")[0].args, ["wip", handler]);
	});

	it("registers workers and schedules declared by decorators", async () => {
		const { PgBossWork, PgBossSchedule } = require("../src/annotation");
		let handled: any[] = [];
		class Worker {
			async handle(job: any) {
				handled.push(job.id);
			}

			async report(job: any) {
				handled.push(job.data.type);
			}
		}

		PgBossWork("email.send")(Worker.prototype, "handle", Object.getOwnPropertyDescriptor(Worker.prototype, "handle")!);
		PgBossSchedule("report.daily", "0 1 * * *", { data: { type: "daily" } })(
			Worker.prototype,
			"report",
			Object.getOwnPropertyDescriptor(Worker.prototype, "report")!
		);

		let worker = new Worker();
		let manager = createManager({ connectionString: "postgres://default" }, [worker]);
		await manager.start();

		assert.deepStrictEqual(calls(bossInstances[0], "createQueue").map((item) => item.args[0]), ["email.send", "report.daily"]);
		assert.deepStrictEqual(calls(bossInstances[0], "schedule")[0].args, ["report.daily", "0 1 * * *", { type: "daily" }, undefined]);
		assert.strictEqual(calls(bossInstances[0], "work").length, 2);
		assert.deepStrictEqual(Array.from((manager as any).workerIds.get("default")), ["email.send-worker", "report.daily-worker"]);

		await bossInstances[0].handlers.get("email.send")!([{ id: "1" }, { id: "2" }]);
		await bossInstances[0].handlers.get("report.daily")!([{ id: "3", data: { type: "daily" } }]);

		assert.deepStrictEqual(handled, ["1", "2", "daily"]);
	});

	it("fails clearly when a decorator references a missing component method", async () => {
		const { PgBossWork } = require("../src/annotation");
		class Worker {}

		PgBossWork("email.send")(Worker.prototype, "missing", {} as PropertyDescriptor);

		let manager = createManager({ connectionString: "postgres://default" }, [new Worker()]);
		await manager.start();

		await assert.rejects(
			() => bossInstances[0].handlers.get("email.send")!([{ id: "1" }]),
			/PgBoss component method missing cannot be found/
		);
	});

	it("rejects duplicate sources and duplicate defaults", async () => {
		let duplicateSource = createManager([
			{ source: "default", connectionString: "postgres://a" },
			{ source: "default", connectionString: "postgres://b" },
		]);
		let duplicateDefault = createManager([
			{ source: "default", default: true, connectionString: "postgres://a" },
			{ source: "audit", default: true, connectionString: "postgres://b" },
		]);

		await assert.rejects(() => duplicateSource.start(), /Duplicate PgBoss source default/);
		await assert.rejects(() => duplicateDefault.start(), /Only one PgBoss source can be marked as default/);
	});

	it("cleans up already-started sources when startup fails", async () => {
		let manager = createManager([
			{ source: "default", connectionString: "postgres://default" },
			{ source: "audit", default: true, connectionString: "postgres://audit" },
		]);

		failStartForConnectionString = "postgres://audit";

		await assert.rejects(() => manager.start(), /start failed for postgres:\/\/audit/);

		assert.strictEqual(bossInstances.length, 2);
		assert.deepStrictEqual(calls(bossInstances[0], "stop")[0].args, [{ graceful: true, wait: true }]);
		assert.deepStrictEqual(manager.listSources(), []);
		assert.deepStrictEqual(manager.getWorkerIds(), []);
		assert.strictEqual(manager.getDefaultSource(), "default");

		failStartForConnectionString = undefined;
		await manager.start();

		assert.strictEqual(manager.getDefaultSource(), "audit");
		assert.deepStrictEqual(manager.listSources(), ["default", "audit"]);
	});

	it("does not register workers twice when start is called more than once", async () => {
		const { PgBossWork } = require("../src/annotation");
		class Worker {
			async handle() {}
		}

		PgBossWork("email.send")(Worker.prototype, "handle", Object.getOwnPropertyDescriptor(Worker.prototype, "handle")!);

		let manager = createManager({ connectionString: "postgres://default" }, [new Worker()]);
		await manager.start();
		await manager.start();

		assert.strictEqual(bossInstances.length, 1);
		assert.strictEqual(calls(bossInstances[0], "work").length, 1);
	});
});
