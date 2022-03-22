import * as Events from "events";

declare type FIELDTYPE = {
	field: string;
	order?: boolean; //是否为倒序 order true为倒序
	compare?: Function;
};

export enum LifeCycleModule {
	ApplicationStart = "applicationStart", //应用初始化完全完成后运行
	ApplicationStop = "applicationStop", //应用结束之前进行执行
	LoadConfigure = "loadConfigure", //应用加载配置文件
}

export enum ComponentKind {
	Controller = "Controller",
	Service = "Service",
	Component = "Component",
}

export enum BootPriority {
	Base = 0, //一般系统级的会优先启动这一个 比如数据库组件等
	Sys = 1, //系统优先的
	Common = 2, //常用
	Other = 3, //额外的
	Lowest = 10000, //默认优先级1万最低
}

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
	InjectionUniqueKey = "injection_uniqueKey",
	Alias = "alias", //别名
}

declare type SYSConfig = {
	application: ApplicationConfig; //应用配置
	settings: Map<string | symbol, any>; //自定义设置项
};

declare type ApplicationConfig = {
	name: string;
	env: string;
	version: string;
	hotter?: boolean;
};

export abstract class Logger {
	abstract info(...args: any[]): void;

	abstract debug(...args: any[]): void;

	abstract warn(...args: any[]): void;

	abstract error(...args: any[]): void;
}

export class FastCarApplication extends Events {
	/***
	 * @version 1.0 根据原型加载注入的方法
	 *
	 */
	getInjectionUniqueKey(target: Object): string;

	/**
	 * @version 1.0 自身作为一个组件注入进去
	 */
	loadSelf(): void;

	/***
	 * @version 1.0 热更新组件
	 */
	addHot(): void;

	/**
	 * @version 1.0 获取资源路径
	 */
	getResourcePath(): string;

	/***
	 * @version 1.0 获取项目的基本路径
	 *
	 */
	getBasePath(): string;

	/**
	 * @version 1.0 更新系统配置
	 * @param sysConfig
	 * @param configName
	 */
	updateSysConfig(sysConfig: SYSConfig, configName: string): void;

	/**
	 * @version 1.0 加载系统配置 加载顺序为 default json < yaml < env
	 *
	 */
	loadSysConfig(): void;

	setSetting(key: string | symbol, value: any): void;

	/**
	 * @version 1.0 获取自定义设置 设置优先级 配置自定义>系统配置>初始化
	 * @param key
	 */
	getSetting(key: string | symbol): any;

	/**
	 * @version 1.0 获取应用配置
	 * @return
	 */
	getapplicationConfig(): /* !this.sysConfig.application */ any;

	/**
	 * @version 1.0 扫描组件
	 */
	loadClass(): void;

	/***
	 * @version 1.0 装配单个模块
	 *
	 */
	injectionModule(instanceName: string, instance: any): void;

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

	/***
	 * @version 1.0 根据原型获取实例
	 */
	getComponentByTarget(target: Object): any;

	/**
	 * @version 1.0 开启日志系统
	 */
	startLog(): void;

	/**
	 * @version 1.0 初始化应用
	 */
	init(): void;

	/***
	 * @version 1.0 退出事件监听
	 *
	 */
	addExitEvent(): void;

	/***
	 * @version 1.0 异常事件进行监听 不至于程序异常直接退出
	 */
	addExecptionEvent(): void;

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
	 * @version 1.0 获取app名称
	 */
	getApplicationName(): string;

	/***
	 * @version 1.0 获取系统日志
	 *
	 */
	getSysLogger(): Logger;

	/***
	 * @version 1.0 获取文件内容
	 */
	getFileContent(fp: string): string;

	/***
	 * @version 1.0 是否支持热更
	 *
	 */
	isHotter(): boolean;

	/**
	 * @version 1.0 指定热更新文件
	 *
	 */
	specifyHotUpdate(fp: string): void;
}

//校验错误
export class ValidError {
	message?: string;
}

export class DataMap<K, V extends Object> extends Map {
	toValues(): V[];

	toKeys(): K[];

	//自定义排序 支持多个排序
	sort(sorts?: FIELDTYPE[], list?: V[]): V[];

	/***
	 * @version 1.0 查找属性名称
	 * @params atts代表属性键值对匹配
	 *
	 */
	findByAtts(atts: { [key: string]: any }): V[];
}
