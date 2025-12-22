//元数据加载模块
export enum FastCarMetaData {
	paramTypes = "design:paramtypes", //传参类型
	returnType = "design:returntype", //返回类型
	designType = "design:type", //设计类型
	InjectionMap = "InjectionMap", //应用服务需要加载的模块
	IocModule = "IocModule", //每个中间件需要加载的模块
	ComponentScan = "ComponentScan", //扫描路径
	ComponentScanExclusion = "ComponentScanExclusion", //排序的扫描路径
	RouterMap = "RouterMap", //路由集合模块
	SpecifyMap = "SpecifyMap", //特定的组件集合
	APP = "APP", //用于指定名称
	DS = "dynamicDataSource",
	DSIndex = "dynamicDataSourceIndex", //数据源索引位置
	ValidFormRules = "validFormRules", //表单校验原始数据
	ValidChildFormRules = "validChildFormRules", //原始
	ValidSize = "valid:size", //校验长度
	NotNull = "valid:notNull", //不为空
	ValidCustom = "valid:custom", //自定义校验方式
	Hotter = "hotter", //是否支持热更
	HotterCallback = "HotterCallback", //热更回调
	HotterFilePath = "HotterFilePath", //热更的路径 按需加载时的需要
	InjectionUniqueKey = "injection_uniqueKey",
	Alias = "alias", //别名
	LoggerModule = "LoggerModule", //日志模块集合
	HotterSysConfig = "hotterSysConfig", //支持热更系统配置
	CustomType = "custom:type", //自定义类型
	ComponentScanMust = "ComponentScanMust", //扫描路径
	InjectionSingleInstance = "InjectionSingleInstance", //单个实例注入的服务
	InjectionLog = "InjectionLog", //反射的日志方法
	InjectionValue = "InjectionValue", //反射注入值
}
