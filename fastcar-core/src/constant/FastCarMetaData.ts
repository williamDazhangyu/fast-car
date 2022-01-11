//元数据加载模块
export enum FastCarMetaData {
	InjectionMap = "InjectionMap", //应用服务需要加载的模块
	IocModule = "IocModule", //每个中间件需要加载的模块
	ComponentScan = "ComponentScan", //扫描路径
	ComponentScanExclusion = "ComponentScanExclusion", //排序的扫描路径
	RouterMap = "RouterMap", //路由集合模块
	SpecifyMap = "SpecifyMap", //特定的组件集合
	APP = "APP", //用于指定名称
	DS = "dynamicDataSource",
	DSIndex = "dynamicDataSourceIndex", //数据源索引位置
}
