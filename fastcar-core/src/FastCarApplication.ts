import "reflect-metadata";
import * as process from "process";
import * as Events from "events";
import * as path from "path";
import ClassLoader from "./utils/classLoader";
import FileUtil from "./utils/FileUtil";
import Format from "./utils/Format";
import MixTool from "./utils/Mix";
import TypeUtil from "./utils/TypeUtil";
import { SYSConfig, SYSDefaultConfig } from "./config/SysConfig";
import { FastCarMetaData } from "./constant/FastCarMetaData";
import { ApplicationConfig } from "./config/ApplicationConfig";
import { ComponentKind } from "./constant/ComponentKind";
import ExceptionMonitor from "./annotation/ExceptionMonitor";
import { CommonConstant, FileResSuffix } from "./constant/CommonConstant";
import { LifeCycleModule } from "./constant/LifeCycleModule";
import * as log4js from "log4js";
import { Log4jsConfig } from "./config/Log4jsConfig";

@ExceptionMonitor
class FastCarApplication extends Events {
	componentMap: Map<string, any>; //组件键值对
	sysConfig: SYSConfig; //系统配置
	basePath: string; //入口文件夹路径
	baseFileName: string; //入口文件路径
	sysLogger: log4js.Logger;

	constructor() {
		super();

		this.sysConfig = SYSDefaultConfig;
		this.componentMap = new Map();
		this.basePath = require.main?.path || module.path;
		this.baseFileName = require.main?.filename || module.filename;
		this.sysLogger = log4js.getLogger();
		this.init();
	}

	/***
	 * @version 1.0 获取资源路径
	 */
	getResourcePath(): string {
		let resourcePath = path.join(this.basePath, CommonConstant.Resource);
		return resourcePath;
	}

	/***
	 * @version 1.0 更新系统配置
	 */
	updateSysConfig(sysConfig: SYSConfig, configName: string) {
		let resPath = this.getResourcePath();

		const replaceSetting = (property: string, fileContent: object) => {
			let addConfig = Reflect.get(fileContent, property);
			if (addConfig) {
				let currConfig = Reflect.get(sysConfig, property);
				Reflect.deleteProperty(fileContent, property);
				if (CommonConstant.Settings == property) {
					Object.keys(addConfig).forEach(key => {
						this.sysConfig.settings.set(key, addConfig[key]);
					});
				} else {
					Object.assign(currConfig, addConfig);
				}
			}
		};

		FileResSuffix.forEach(suffix => {
			let fileContent = FileUtil.getResource(path.join(resPath, `${configName}.${suffix}`));
			if (fileContent) {
				replaceSetting(CommonConstant.Settings, fileContent);

				replaceSetting(CommonConstant.Application, fileContent);
				//追加自定的属性
				MixTool.copyProperties(sysConfig, fileContent);
			}
		});
	}

	/***
	 * @version 1.0 加载系统配置
	 * @param 加载顺序为 default json < yaml < env
	 */
	loadSysConfig() {
		this.updateSysConfig(this.sysConfig, CommonConstant.Application);
		let env = Reflect.getMetadata(CommonConstant.ENV, this) || this.sysConfig.application.env;
		this.updateSysConfig(this.sysConfig, `${CommonConstant.Application}-${env}`);
	}

	setSetting(key: string, value: any) {
		this.sysConfig.settings.set(key, value);
	}

	/***
	 * @version 1.0 获取自定义设置 设置优先级 配置自定义>系统配置>初始化
	 *
	 */
	getSetting(key: string): any {
		return this.sysConfig.settings.get(key) || Reflect.get(this.sysConfig, key) || Reflect.get(this, key);
	}

	/***
	 * @version 1.0 获取应用配置
	 */
	getapplicationConfig(): ApplicationConfig {
		return this.sysConfig.application;
	}

	/***
	 * @version 1.0 注入需要初始化的组件
	 */
	static setInjectionMap(name: string): void {
		let loadModule = FastCarMetaData.InjectionMap;
		let names: string[] = Reflect.getMetadata(loadModule, FastCarApplication) || [];
		names.push(name);

		Reflect.defineMetadata(loadModule, names, FastCarApplication);
	}

	/***
	 * @version 1.0 判断是否已经有初始化的组件了
	 */
	static hasInjectionMap(name: string): boolean {
		let loadModuleName = FastCarMetaData.InjectionMap;
		if (!Reflect.hasMetadata(loadModuleName, FastCarApplication)) {
			return false;
		}

		let names = Reflect.getMetadata(loadModuleName, FastCarApplication);
		return names.includes(name);
	}

	/***
	 * @version 1.0 扫描组件
	 */
	loadClass() {
		let tmpFilePath: string[] = Array.of();
		let includeList: string[] = Reflect.getMetadata(FastCarMetaData.ComponentScan, this);

		if (includeList) {
			includeList.forEach(item => {
				let tmpList = FileUtil.getFilePathList(item);
				tmpList.reverse();
				tmpFilePath = [...tmpFilePath, ...tmpList];
			});
		}

		let filePathList = FileUtil.getFilePathList(this.basePath);
		filePathList.reverse();
		filePathList = [...tmpFilePath, ...filePathList];
		filePathList = [...new Set(filePathList)];

		let excludeList: string[] = Reflect.getMetadata(FastCarMetaData.ComponentScanExclusion, this);
		if (excludeList) {
			let excludAllPath: string[] = [];
			excludeList.forEach(item => {
				let exlist = FileUtil.getFilePathList(item);
				excludAllPath = [...excludAllPath, ...exlist];
			});

			filePathList = filePathList.filter(item => {
				return !excludAllPath.includes(item);
			});
		}

		for (let f of filePathList) {
			if (f == this.baseFileName) {
				continue;
			}

			let moduleClass = ClassLoader.loadModule(f);
			if (moduleClass != null) {
				console.log(f);
				moduleClass.forEach((func, name) => {
					if (this.componentMap.has(name)) {
						let repeatError = new Error(`Duplicate ${name} instance objects are not allowed `);
						this.sysLogger.error(repeatError.message);
						throw repeatError;
					}

					//只有依赖注入的组件才能被实例化
					if (FastCarApplication.hasInjectionMap(name)) {
						if (TypeUtil.isFunction(func)) {
							this.componentMap.set(name, new func());
							return;
						}

						this.componentMap.set(name, func);
					}
				});
			}
		}
	}

	/**
	 * @version 1.0 加载需要注入的类
	 */
	loadInjectionModule() {
		let relyname = FastCarMetaData.IocModule;

		this.componentMap.forEach((instance, instanceName) => {
			let moduleList: Set<string> = Reflect.getMetadata(relyname, instance);
			if (!moduleList || moduleList.size == 0) {
				return;
			}
			moduleList.forEach((name: string) => {
				let func = this.componentMap.get(name);

				if (name === "App") {
					func = this;
				} else {
					if (!this.componentMap.has(name)) {
						//找不到依赖项
						let injectionError = new Error(`Unsatisfied dependency expressed through ${name} in ${instanceName} `);
						this.sysLogger.error(injectionError.message);
						throw injectionError;
					}
				}

				let propertyKey = Format.formatFirstToLow(name);
				Reflect.set(instance, propertyKey, func);
			});
		});
	}

	/***
	 * @version 1.0 根据类型获取组件
	 */
	getComponentByType(name: ComponentKind): object[] {
		let instanceList: Object[] = Array.of();
		this.componentMap.forEach(instance => {
			let flag = Reflect.hasMetadata(name, instance);
			if (flag) {
				instanceList.push(instance);
			}
		});

		return instanceList;
	}

	/***
	 * @version 1.0 获取全部的组件列表
	 */
	getComponentList(): object[] {
		let instanceList: Object[] = Array.of();
		this.componentMap.forEach((instance, name) => {
			if (FastCarApplication.hasInjectionMap(name)) {
				instanceList.push(instance);
			}
		});

		return instanceList;
	}

	/***
	 * @version 1.0 根据名称组件
	 */
	getComponentByName(name: string): object {
		return this.componentMap.get(name);
	}

	/**
	 * @version 1.0 开启日志系统
	 */
	startLog() {
		let logconfig: Log4jsConfig = this.getSetting("log4js");
		if (logconfig) {
			let existConfig: Log4jsConfig = Reflect.getMetadata("log4js", this);
			if (!!existConfig) {
				logconfig.appenders = Object.assign(existConfig.appenders, logconfig?.appenders);
				logconfig.categories = Object.assign(existConfig.categories, logconfig?.categories);
				logconfig = Object.assign(existConfig, logconfig);
			}
			//导入日志模块
			log4js.configure(logconfig);
			Object.keys(logconfig.categories).forEach(key => {
				//加入服务
				this.componentMap.set(Format.formatFirstToUp(key), log4js.getLogger(key));
			});
		}
	}

	/***
	 * @version 1.0 初始化应用
	 */
	init() {
		this.beforeStartServer();
		this.startServer();
		this.addExitEvent();
	}

	addExitEvent() {
		process.on("beforeExit", async () => {
			await this.beforeStopServer();
			process.exit();
		});

		process.on("exit", () => {
			this.stopServer();
		});
	}

	/***
	 * @version 1.0 自动调用方法
	 */
	async automaticRun(name: LifeCycleModule) {
		for (let [key, item] of this.componentMap) {
			let applicationStart = Reflect.hasMetadata(name, item);
			if (applicationStart) {
				if (TypeUtil.isFunction(item.run)) {
					if (TypeUtil.isPromise(item.run)) {
						await item.run();
					} else {
						Reflect.apply(item.run, item, []);
					}
				}
			}
		}
	}

	/**
	 * @version 1.0 开启应用前执行的操作 加载配置,扫描组件，注入依赖组件
	 */
	beforeStartServer() {
		this.sysLogger.info("Start loading system configuration");
		this.loadSysConfig();
		this.sysLogger.info("Complete loading system configuration");

		this.startLog();

		this.sysLogger.info("Start scanning component");
		this.loadClass();
		this.sysLogger.info("Complete component scan");

		this.sysLogger.info("Start component injection");
		this.loadInjectionModule();
		this.sysLogger.info("Complete component injection");
	}

	/***
	 * @version 1.0 启动服务
	 */
	async startServer() {
		this.sysLogger.info("Call application initialization method");
		await this.automaticRun(LifeCycleModule.ApplicationStart);

		this.sysLogger.info("start server is run");
	}

	/***
	 * @version 1.0 停止服务前自动调用服务
	 */
	async beforeStopServer() {
		this.sysLogger.info("Call the method before the application stops");
		await this.automaticRun(LifeCycleModule.ApplicationStop);
	}

	/***
	 * @version 1.0 停止服务
	 */
	stopServer() {
		this.sysLogger.info("application stop");
	}
}

export default FastCarApplication;
