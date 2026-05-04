# Changelog

## 0.0.1

- 集成 FastCar 生命周期，自动启动和停止 pg-boss。
- 支持单数据源和多数据源配置。
- 提供 `PgBossWork`、`PgBossSchedule`、`EnablePgBoss` 装饰器。
- 提供任务发送、队列管理、定时任务管理、动态 worker 管理和数据源健康检查 API。
- 提供中文 README 示例。
- 完善公共类型声明，补充 `PgBossData`、`PgBossInstance`、`PgBossJobWithMetadata`、`PgBossQueueResult` 等开发者类型。
- 增加队列、任务、存储维护和原生实例访问 API 的单元测试覆盖。
- 启动过程中任一数据源初始化失败时，会自动停止并清理已启动的数据源，避免半启动状态。
- 事件监听 API 增加 `error`、`wip`、`monitor-states`、`maintenance`、`stopped` 的精确类型提示，并保留自定义事件兼容性。
- 同步 `PgBossScheduleMeta` 的 payload 类型为 `PgBossData`，并收紧手动 `work`/`registerWorker` handler 为 pg-boss 原生 jobs 数组语义。
- 增加 `PgBossResolvedData` 类型别名，表达 `undefined` payload 会被转换为空对象的包装层行为。
- 增加 opt-in PostgreSQL 集成测试，通过 `PGBOSS_TEST_CONNECTION` 运行真实 pg-boss schema、队列、worker、schedule 和健康检查流程，默认单测不连接数据库。
