//元数据加载模块
export enum FastCarMetaData {
	InjectionMap = "InjectionMap", //应用服务需要加载的模块
	IocModule = "IocModule", //每个中间件需要加载的模块
	ComponentScan = "ComponentScan", //扫描路径
	ComponentScanExclusion = "ComponentScanExclusion", //排序的扫描路径
	RouterMap = "RouterMap", //路由集合模块
	ScheduledModule = "ScheduledModule", //定时任务模块
	TimerMapModule = "TimerModule", //定时模块集合
}
