import { ApplicationConfig } from "../config/ApplicationConfig";
import { ComponentKind } from "../constant/ComponentKind";
import { LifeCycleModule } from "../constant/LifeCycleModule";
import { ComponentDesc } from "../type/ComponentDesc";
import { ProcessType } from "../type/ProcessType";
import Logger from "./Logger";

export default interface ApplicationInterface {
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
	getapplicationConfig(): ApplicationConfig;

	/**
	 * @version 1.0 扫描组件
	 */
	loadClass(): void;

	/***
	 * @version 1.0 装配单个模块
	 * @deprecated 修改为主动查找时装配
	 */
	injectionModule(instance: any, instanceName: string | symbol): void;

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

	/**
	 * @version 1.0 加载需要注入的类
	 * @deprecated 修改为主动查找时装配
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
	getComponentByName(name: string | symbol): any;

	/***
	 * @version 1.0 根据原型获取实例
	 */
	getComponentByTarget(target: Object): any;

	/**
	 * @version 1.0 获取组件详情列表
	 *
	 */
	getComponentDetailsList(): ComponentDesc[];

	/**
	 * @version 1.0 判断组件是否存在
	 */
	hasComponentByName(name: string | symbol): boolean;

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
