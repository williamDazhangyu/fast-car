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
	application: ApplicationConfig; //应用配置
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
	getapplicationConfig(): /* !this.sysConfig.application */ any;

	/***
	 * @version 1.0 指定加载的组件
	 *
	 */
	static setSpecifyCompent(m: any): void;

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
	getComponentByType(name: ComponentKind): any[];

	/**
	 * @version 1.0 获取全部的组件列表
	 * @return
	 */
	getComponentList(): any[];

	/**
	 * @version 1.0 根据名称组件
	 * @param name
	 */
	getComponentByName(name: string): any;

	/**
	 * @version 1.0 开启日志系统
	 */
	startLog(): void;

	/**
	 * @version 1.0 初始化应用
	 */
	init(): void;

	addExitEvent(): void;

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
