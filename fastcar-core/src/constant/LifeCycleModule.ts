export enum LifeCycleModule {
	ApplicationStart = "applicationStart", //应用初始化完全完成后运行
	ApplicationStop = "applicationStop", //应用结束之前进行执行
	LoadConfigure = "loadConfigure", //应用加载配置文件
}
