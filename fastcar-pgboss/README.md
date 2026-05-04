# @fastcar/pgboss

`@fastcar/pgboss` 是面向 FastCar 应用的 `pg-boss` 包装模块。它会跟随 FastCar 生命周期自动启动和停止，支持多 PostgreSQL 数据源，并提供任务消费者和定时任务装饰器。

`pg-boss@10.x` 需要 Node.js 20+ 和 PostgreSQL 13+。

## 版本兼容

- Node.js：`>=20`
- PostgreSQL：`>=13`
- `@fastcar/core`：`>=0.3.20 <1`
- `pg-boss`：`^10.3.0`

## 安装

```bash
npm install @fastcar/pgboss pg-boss
```

## 配置

单数据源配置示例：

```yaml
pgboss:
  connectionString: postgresql://user:password@127.0.0.1:5432/app
  schema: pgboss
  queues:
    - name: email.send
      options:
        retryLimit: 3
        retryDelay: 5
  schedules:
    - name: report.daily
      cron: "0 1 * * *"
      data:
        type: daily
      options:
        tz: Asia/Shanghai
```

多数据源配置示例：

```yaml
pgboss:
  - source: default
    default: true
    connectionString: postgresql://user:password@127.0.0.1:5432/app
  - source: audit
    connectionString: postgresql://user:password@127.0.0.1:5432/audit
    schema: audit_pgboss
```

`source` 是包装层内部使用的数据源名称；`default: true` 表示默认数据源。除 `source`、`default`、`queues`、`schedules` 外，其它字段会透传给 `pg-boss` 构造参数。

## 启用模块

```ts
import { Application } from "@fastcar/core/annotation";
import { EnablePgBoss } from "@fastcar/pgboss/annotation";

@Application
@EnablePgBoss
class App {}
```

## 发送任务

```ts
import { Autowired, Service } from "@fastcar/core/annotation";
import { PgBossManager } from "@fastcar/pgboss";

@Service
class EmailService {
	@Autowired
	private boss!: PgBossManager;

	async sendEmail() {
		await this.boss.send(
			"email.send",
			{ to: "user@example.com", subject: "欢迎使用 FastCar" },
			{ retryLimit: 3 }
		);
	}

	async sendAuditLog() {
		await this.boss.send("audit.log", { action: "login" }, undefined, "audit");
	}
}
```

## 消费任务

```ts
import { Service } from "@fastcar/core/annotation";
import { PgBossJob } from "@fastcar/pgboss";
import { PgBossWork } from "@fastcar/pgboss/annotation";

@Service
class EmailWorker {
	@PgBossWork("email.send", { batchSize: 5 })
	async handle(job: PgBossJob<{ to: string; subject: string }>) {
		console.log("发送邮件", job.data.to, job.data.subject);
	}
}
```

如果要一次处理一批任务，可以启用 `batch`：

```ts
import { Service } from "@fastcar/core/annotation";
import { PgBossJob } from "@fastcar/pgboss";
import { PgBossWork } from "@fastcar/pgboss/annotation";

@Service
class BatchEmailWorker {
	@PgBossWork("email.send", { batchSize: 20, batch: true })
	async handle(jobs: PgBossJob<{ to: string }>[]) {
		for (let job of jobs) {
			console.log("批量发送邮件", job.data.to);
		}
	}
}
```

## 定时任务

```ts
import { Service } from "@fastcar/core/annotation";
import { PgBossJob } from "@fastcar/pgboss";
import { PgBossSchedule } from "@fastcar/pgboss/annotation";

@Service
class ReportWorker {
	@PgBossSchedule("report.daily", "0 1 * * *", {
		data: { type: "daily" },
		tz: "Asia/Shanghai",
	})
	async handle(job: PgBossJob<{ type: string }>) {
		console.log("生成日报", job.data.type);
	}
}
```

## 手动管理定时任务

除装饰器外，也可以在业务代码或管理接口中动态注册、立即触发或取消定时任务。

```ts
import { Autowired, Service } from "@fastcar/core/annotation";
import { PgBossManager } from "@fastcar/pgboss";

@Service
class ScheduleAdminService {
	@Autowired
	private boss!: PgBossManager;

	async createDailyReportSchedule() {
		await this.boss.registerSchedule(
			"report.daily",
			"0 1 * * *",
			{ type: "daily" },
			{ tz: "Asia/Shanghai" }
		);
	}

	async runDailyReportNow() {
		await this.boss.triggerSchedule("report.daily", {
			type: "manual",
			operator: "admin",
		});
	}

	async stopDailyReportSchedule() {
		await this.boss.cancelSchedule("report.daily");
	}
}
```

多数据源场景可以传入最后一个 `source` 参数：

```ts
await boss.registerSchedule("audit.daily", "0 2 * * *", { type: "audit" }, undefined, "audit");
await boss.triggerSchedule("audit.daily", { type: "manual" }, undefined, "audit");
await boss.cancelSchedule("audit.daily", "audit");
```

## 手动管理消费者

如果消费者不是固定写在装饰器里，可以在运行时注册或停止 worker。

```ts
let workerId = await boss.registerWorker(
	"email.send",
	async (jobs) => {
		for (let job of jobs) {
			console.log("发送邮件", job.data);
		}
	},
	{ batchSize: 10 }
);

boss.notifyWorker(workerId!);
await boss.stopWorker(workerId!);
```

也可以按数据源查看或停止当前包装层注册过的 worker：

```ts
let ids = boss.getWorkerIds("audit");
boss.notifyWorkers("audit");
await boss.stopWorkers("audit");
```

## 事件和健康检查

可以透传监听 `pg-boss` 事件，并检查当前数据源状态。

```ts
boss.on("error", (error) => {
	console.error("pg-boss error", error);
});

boss.on("wip", (workers) => {
	console.log("运行中的 worker", workers);
});

boss.on("monitor-states", (states) => {
	console.log("队列状态", states.queues);
});

let sources = boss.listSources();
let status = await boss.getSourceStatus();
let allStatus = await boss.getSourceStatuses();
let healthy = await boss.healthCheck("audit");
```

## 常用 API

```ts
await boss.createQueue("image.resize", { retryLimit: 2 });
await boss.sendAfter("image.resize", { id: "img_1" }, {}, 60);
await boss.sendThrottled("sms.send", { phone: "13800000000" }, {}, 30, "user:1");
await boss.sendDebounced("search.reindex", { id: 1 }, {}, 10, "product:1");

let jobs = await boss.fetch("image.resize", { batchSize: 10 });
await boss.complete("image.resize", "job-id");
await boss.fail("image.resize", "job-id", { reason: "处理失败" });
```

查询队列、任务和维护存储：

```ts
let queues = await boss.getQueues();
let queue = await boss.getQueue("image.resize");
let size = await boss.getQueueSize("image.resize", { before: "completed" });
let job = await boss.getJobById("image.resize", "job-id", { includeArchive: true });

await boss.retry("image.resize", "job-id");
await boss.archive();
await boss.maintain();
```

## 原生 pg-boss 实例

包装层覆盖了常用队列、worker、schedule 和维护 API。如果需要使用尚未包装的 `pg-boss` 能力，可以通过 `getBoss()` 取得原生实例：

```ts
let nativeBoss = boss.getBoss();
let auditBoss = boss.getBoss("audit");
```

业务代码优先使用 `PgBossManager` 上的包装方法；只有在确实需要原生 API 时再使用 `getBoss()`。

## 注意事项

- 队列名、cron 表达式和 `pg-boss` 选项遵循 `pg-boss` 原生规则。
- 使用多数据源时，调用 API 的最后一个参数可传 `source`，例如 `boss.send("queue", data, options, "audit")`。
- 装饰器会在应用启动时自动创建队列并注册 worker；重复的 `source` 或多个默认数据源会被拒绝。
- 如果启动过程中某个数据源初始化失败，包装层会停止并清理已经启动的数据源，避免应用处于半启动状态。
- `pg-boss` 支持多进程和多实例消费同一队列，任务抢占由 PostgreSQL 锁保证；业务处理函数仍建议保持幂等，以应对重试、超时和人工补偿。
- 如果使用 `@PgBossSchedule`，多个应用实例可以同时启动，`pg-boss` 会在数据库层协调定时任务；不要在应用外层再重复手动发送同一份定时任务。
- 包装层保留 falsy payload，例如 `false`、`0`、`""`、`null`；只有 `undefined` 会被转换为空对象 `{}`。

## 测试建议

当前单元测试覆盖了配置归一化、多数据源、装饰器注册、falsy payload、worker 管理和常用 API 透传。发布到生产前，建议业务项目额外增加一组真实 PostgreSQL 集成测试，至少覆盖：

- schema 初始化和迁移是否正常执行；
- 同一队列多 worker/多实例消费是否符合预期；
- schedule 是否按目标时区触发；
- handler 抛错、任务超时和 retry 策略是否符合业务预期。

项目已提供可选的 PostgreSQL 集成测试。默认 `npm test` 不会连接数据库；只有设置 `PGBOSS_TEST_CONNECTION` 后才会运行真实数据库用例。测试会为每次运行创建唯一 schema，并在结束后执行 `DROP SCHEMA ... CASCADE` 清理。

PowerShell 示例：

```powershell
$env:PGBOSS_TEST_CONNECTION="postgres://postgres:123456@127.0.0.1:5432/postgres"
npm run test:integration
```

Linux/macOS 示例：

```bash
PGBOSS_TEST_CONNECTION="postgres://postgres:123456@127.0.0.1:5432/postgres" npm run test:integration
```

当前集成测试覆盖真实 schema 初始化、队列创建与查询、`send/fetch/complete/getJobById`、`registerWorker/notifyWorker/stopWorker`、`schedule/getSchedules/unschedule`、`healthCheck` 和 schema 清理。

## 发布前检查

```bash
npm run build
npm test
npm run test:integration
npm run typecheck
npm run pack:check
```

如果只想做源码和声明文件检查，可以先运行：

```bash
npx tsc --noEmit
npm run typecheck
npm test
```

完整发布前仍应运行：

```bash
npm run build
npm test
npm run test:integration
npm run typecheck
npm run pack:check
```

`@fastcar/core` 和 `pg-boss` 是 peer dependencies，业务项目需要自行安装兼容版本。
