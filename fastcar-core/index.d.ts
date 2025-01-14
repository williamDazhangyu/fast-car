import * as Events from "events";
import { ApplicationConfig } from "./src/config/ApplicationConfig";
import { ComponentKind } from "./src/constant/ComponentKind";
import { LifeCycleModule } from "./src/constant/LifeCycleModule";
import { FIELDTYPE } from "./src/model/DataMap";
import { ProcessType } from "./src/type/ProcessType";
import { HotReloadEnum } from "./src/type/FileHotterDesc";
import { ClassConstructor } from "./src/type/ClassConstructor";

declare type ComponentDesc = {
	id: string;
	name: string;
	path: string;
};

export * from "./src/config/SysConfig";

export * from "./src/config/ApplicationConfig";

export * from "./src/constant/LifeCycleModule";

export * from "./src/constant/ComponentKind";

export * from "./src/constant/BootPriority";

//元数据加载模块
export * from "./src/constant/FastCarMetaData";

//自定义常量模块
export * from "./src/constant/CommonConstant";

//生命周期约定
export * from "./src/interface/ApplicationHook";

export { FIELDTYPE } from "./src/model/DataMap";

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
	 * @version 1.1 热更新配置文件
	 */
	addHot(): void;

	addDelayHot(fp: string, loadType: HotReloadEnum): void;

	reloadFiles(): void;

	/***
	 * @version 1.0 获取资源路径
	 */
	getResourcePath(): string;
	/***
	 * @version 1.0 获取项目的基本路径
	 *
	 */
	getBasePath(): string;

	/**
	 * @version 1.0 获取项目读取的基本配置路径
	 */
	getBaseName(): string;
	/***
	 * @version 1.0 加载系统配置 加载顺序为 default json < yaml < env
	 *
	 */
	loadSysConfig(): void;

	setSetting(key: string | symbol, value: any): void;

	/***
	 * @version 1.0 获取自定义设置 设置优先级 配置自定义>系统配置>初始化
	 *
	 */
	getSetting(key: string | symbol): any;

	/***
	 * @version 1.0 获取应用配置
	 */
	getapplicationConfig(): ApplicationConfig;
	/***
	 * @version 1.0 扫描组件
	 * @version 1.1 新增手动注入组件
	 * @version 1.2 改成统一入口
	 */
	loadClass(): void;

	/***
	 * @version 1.0 根据名称获取组件的加载情况
	 *
	 */
	getComponentDetailByName(name: string | symbol): ComponentDesc | undefined;

	/***
	 * @version 1.0 根据原型获取组件的加载信息
	 *
	 */
	getComponentDetailByTarget(target: Object): ComponentDesc | undefined;

	getInjectionUniqueKeyByFilePath(fp: string, name: string): string | symbol | null;
	/***
	 * @version 1.0 转成实例对象
	 * @version 1.0.1 新增加载时识别载入配置选项
	 *
	 */
	convertInstance(classZ: any, fp: string): void;

	/***
	 * @version 1.0 根据类型获取组件
	 */
	getComponentByType(name: ComponentKind): any[];

	/***
	 * @version 1.0 获取全部的组件列表
	 */
	getComponentList(): (Object | ClassConstructor<Object>)[];
	/***
	 * @version 1.0 根据名称组件
	 */
	getComponentByName(name: string | symbol): Object | null;
	/**
	 * @version 1.0 组件改成按需加载的模式
	 */
	getBean(key: string | symbol): Object | null;

	loadInjectionService(instance: Object): void;

	loadLoggerIOC(instance: Object): void;

	/***
	 * @version 1.0 判断是否拥有组件名称
	 */
	hasComponentByName(name: string | symbol): boolean;

	/***
	 * @version 1.0 根据原型获取实例
	 */
	getComponentByTarget<T>(target: Object): T | null;

	/**
	 * @version 1.0 获取组件详情列表
	 *
	 */
	getComponentDetailsList(): ComponentDesc[];

	/**
	 * @version 1.0 开启日志系统
	 * @version 1.1 更改为采用winston日志
	 */
	startLog(): void;

	/***
	 * @version 1.0 初始化应用
	 */
	init(): void;

	/***
	 * @version 1.0 退出事件监听
	 *
	 */
	exitEvent(msg: string): Promise<void>;

	addExitEvent(): void;

	/***
	 * @version 1.0 异常事件进行监听 不至于程序异常直接退出
	 */
	addExecptionEvent(): void;

	/***
	 * @version 1.0 自动调用方法
	 */
	automaticRun(name: LifeCycleModule): Promise<void>;

	/**
	 * @version 1.0 开启应用前执行的操作 加载配置,扫描组件，注入依赖组件
	 */
	beforeStartServer(): void;
	/***
	 * @version 1.0 启动服务
	 */
	startServer(): Promise<void>;
	/***
	 * @version 1.0 停止服务前自动调用服务
	 */
	beforeStopServer(): Promise<void>;
	/***
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
	 * @version 0.2.11 根据名称获取logger
	 *
	 */
	getLogger(category?: string): Logger;

	/***
	 * @version 1.0 获取文件内容
	 */
	getFileContent(fp: string): string;

	/***
	 * @version 1.0 是否支持热更
	 *
	 */
	isHotter(): boolean;
	/***
	 * @version 1.0 是否支持资源文件热更
	 */
	isHotterSysConfig(): boolean;

	/**
	 * @version 1.0 指定热更新文件
	 *
	 */
	specifyHotUpdate(fp: string): void;

	/***
	 * @version 1.0 获取进程的信息
	 *
	 */
	getMemoryUsage(): ProcessType;
}

//校验错误
export class ValidError {
	message?: string;
}

export class DataMap<K, V extends Object> extends Map<K, V> {
	init(list: Array<V>, key: string): void;

	toValues(): V[];

	toKeys(): K[];

	//构造一个字典对象
	toObject(): { [key: string]: V };

	//自定义排序 支持多个排序
	sort(sorts?: FIELDTYPE[], list?: V[]): V[];

	/***
	 * @version 1.0 查找属性名称
	 * @params atts代表属性键值对匹配
	 *
	 */
	findByAtts(atts: { [key: string]: any | any[] }): V[];
}
