import "reflect-metadata";
import * as assert from "assert";
import { Client } from "pg";
import PgBossManager from "../src/PgBossManager";
import { PgBossJob } from "../src";

type TestManager = PgBossManager & {
	app: {
		getSetting(key: string): unknown;
		getComponentList(): unknown[];
	};
	sysLogger: {
		info(...args: unknown[]): void;
		debug(...args: unknown[]): void;
		warn(...args: unknown[]): void;
		error(...args: unknown[]): void;
	};
};

const connectionString = process.env.PGBOSS_TEST_CONNECTION;
const describeIntegration = connectionString ? describe : describe.skip;

function uniqueSchema() {
	return `pgboss_it_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createManager(schema: string): TestManager {
	let manager = new PgBossManager() as TestManager;
	manager.app = {
		getSetting(key: string) {
			return key == "pgboss"
				? {
					connectionString,
					schema,
					queues: [{ name: "it.configured" }],
				}
				: undefined;
		},
		getComponentList() {
			return [];
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

async function dropSchema(schema: string) {
	if (!connectionString) {
		return;
	}

	let client = new Client({ connectionString });
	await client.connect();
	try {
		await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
	} finally {
		await client.end();
	}
}

describeIntegration("PgBossManager PostgreSQL integration", () => {
	let schema: string;
	let manager: TestManager;

	beforeEach(() => {
		schema = uniqueSchema();
		manager = createManager(schema);
	});

	afterEach(async () => {
		await manager.stop().catch(() => undefined);
		await dropSchema(schema);
	});

	it("runs queue, worker, schedule, status, and cleanup APIs against a real database", async () => {
		await manager.start();

		assert.strictEqual(manager.getDefaultSource(), "default");
		assert.deepStrictEqual(manager.listSources(), ["default"]);
		assert.strictEqual(await manager.healthCheck(), true);

		let queueName = "it.queue";
		await manager.createQueue(queueName, { retryLimit: 1 });
		let queues = await manager.getQueues();
		assert.ok(queues.some((queue) => queue.name == "it.configured"));
		assert.ok(queues.some((queue) => queue.name == queueName));

		let firstId = await manager.send(queueName, { value: 1 }, { priority: 1 });
		assert.ok(firstId);

		let fetched = await manager.fetch<{ value: number }>(queueName, { batchSize: 1, includeMetadata: true });
		assert.strictEqual(fetched.length, 1);
		assert.strictEqual(fetched[0].id, firstId);
		assert.deepStrictEqual(fetched[0].data, { value: 1 });
		assert.strictEqual(fetched[0].state, "active");

		await manager.complete(queueName, firstId, { done: true });
		let completed = await manager.getJobById(queueName, firstId, { includeArchive: true });
		assert.ok(completed);
		assert.strictEqual(completed.id, firstId);
		assert.strictEqual(completed.state, "completed");

		let handled: Array<PgBossJob<{ value: number }>> = [];
		let workerId = await manager.registerWorker<{ value: number }>(
			queueName,
			async (jobs) => {
				handled.push(...jobs);
			},
			{ batchSize: 1, pollingIntervalSeconds: 1 }
		);

		let secondId = await manager.send(queueName, { value: 2 });
		assert.ok(secondId);
		manager.notifyWorker(workerId);
		await waitFor(() => handled.some((job) => job.id == secondId));
		await manager.stopWorker(workerId);
		assert.deepStrictEqual(manager.getWorkerIds(), []);

		await manager.registerSchedule("it.schedule", "0 1 * * *", { type: "daily" }, { tz: "Asia/Shanghai" });
		let schedules = await manager.getSchedules();
		assert.ok(schedules.some((schedule) => schedule.name == "it.schedule"));
		let triggeredId = await manager.triggerSchedule("it.schedule", { type: "manual" });
		assert.ok(triggeredId);
		await manager.cancelSchedule("it.schedule");
		assert.ok(!(await manager.getSchedules()).some((schedule) => schedule.name == "it.schedule"));

		assert.strictEqual(await manager.getQueueSize(queueName, { before: "completed" }), 0);
		let emptyQueueName = "it.empty";
		await manager.createQueue(emptyQueueName);
		await manager.deleteQueue(emptyQueueName);
		assert.strictEqual(await manager.getQueue(emptyQueueName), null);
	});
});

async function waitFor(predicate: () => boolean, timeoutMs = 10000): Promise<void> {
	let start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (predicate()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	throw new Error("Timed out waiting for integration condition");
}
