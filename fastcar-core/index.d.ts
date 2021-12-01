export enum LifeCycleModule {
	ApplicationStart = "applicationStart", //应用初始化完全完成后运行
	ApplicationStop = "applicationStop", //应用结束之前进行执行
}

export enum ComponentKind {
	Controller = "Controller",
	Service = "Service",
	Component = "Component",
}

declare type SYSConfig = {
	applicaion: ApplicationConfig; //应用配置
	settings: Map<string, any>; //自定义设置项
};

declare type ApplicationConfig = {
	name: string;
	env: string;
	port: number;
	serverIP: string;
	ssl?: boolean;
};

export class FastCarApplication {
	/**
	 * @version 1.0 获取资源路径
	 */
	getResourcePath(): string;

	/**
	 * @version 1.0 更新系统配置
	 * @param sysConfig
	 * @param configName
	 */
	updateSysConfig(sysConfig: SYSConfig, configName: string): void;

	/**
	 * @version 1.0 加载系统配置
	 * @param 加载顺序为 default json < yaml < env
	 */
	loadSysConfig(): void;

	setSetting(key: string, value: any): void;

	/**
	 * @version 1.0 获取自定义设置 设置优先级 配置自定义>系统配置>初始化
	 * @param key
	 */
	getSetting(key: string): any;

	/**
	 * @version 1.0 获取应用配置
	 * @return
	 */
	getApplicaionConfig(): /* !this.sysConfig.applicaion */ any;

	/**
	 * @version 1.0 扫描组件
	 */
	loadClass(): void;

	/**
	 * @version 1.0 加载需要注入的类
	 */
	loadInjectionModule(): void;

	/**
	 * @version 1.0 根据类型获取组件
	 * @param name
	 * @return
	 */
	getComponentByType(name: ComponentKind): object[];

	/**
	 * @version 1.0 获取全部的组件列表
	 * @return
	 */
	getComponentList(): object[];

	/**
	 * @version 1.0 根据名称组件
	 * @param name
	 */
	getComponentByName(name: string): object;

	/**
	 * @version 1.0 初始化应用
	 */
	init(): void;

	/**
	 * @version 1.0 自动调用方法
	 * @param name
	 */
	automaticRun(name: LifeCycleModule): void;

	/**
	 * @version 1.0 开启应用前执行的操作 加载配置,扫描组件，注入依赖组件
	 */
	beforeStartServer(): void;

	/**
	 * @version 1.0 启动服务
	 */
	startServer(): void;

	/**
	 * @version 1.0 停止服务前自动调用服务
	 */
	beforeStopServer(): void;

	/**
	 * @version 1.0 停止服务
	 */
	stopServer(): void;

	/**
	 *
	 * @version 1.0 注入需要初始化的组件
	 */
	static setInjectionMap(name: string): void;

	/**
	 *
	 * @version 1.0 判断是否已经有初始化的组件了
	 *
	 */
	static hasInjectionMap(name: string): boolean;
}

type Ret = (target: any) => void;

type RetProperty = (target: any, prop?: string, descriptor?: PropertyDescriptor) => void;

declare module annotation {
	/**
	 * 设置初始化的env 注入在原始的application上面
	 */
	function ENV(name: string): Ret;

	/***
	 * 应用启动注解类
	 */
	function ApplicationStart(target: any): void;
	function ApplicationStop(target: any): void;

	/***
	 * 组件模块扫描类
	 */
	function ComponentScan(...names: string[]): Ret;
	function ComponentScanExclusion(...names: string[]): Ret;

	/***
	 * 用于描述不同组件的作用类
	 */
	function Component(target: any): void;
	function Configure(target: any): void;
	function Controller(target: any): void;
	function Service(target: any): void;

	//此方法用来构造不同的注入，不建议直接用于注解上
	function Injection(target: any, name: string): void;

	//应用注解类
	function Application(target: any): any;

	//自动注入类
	function Autowired(target: any, propertyKey: string): void;

	//异常方法类
	function ExceptionMonitor(target: any): void;

	//用于标记废弃
	function Deprecate(msg: string): void;

	//标记为未实现
	function NotImplemented(target: any, name?: string, descriptor?: PropertyDescriptor): void;

	//用于声明是否被重载了
	function Override(target: any, name?: string, descriptor?: PropertyDescriptor): void;

	//用于标记是否只读
	function Readonly(target: any, name?: string, descriptor?: PropertyDescriptor): void;
}
