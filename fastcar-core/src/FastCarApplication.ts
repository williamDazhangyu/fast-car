import "reflect-metadata";
import * as process from "process";
import * as Events from "events";
import * as path from "path";
import ClassLoader from "./utils/classLoader";
import FileUtil from "./utils/FileUtil";
import MixTool from "./utils/Mix";
import TypeUtil from "./utils/TypeUtil";
import { LogDefaultConfig, SYSConfig, SYSDefaultConfig } from "./config/SysConfig";
import { FastCarMetaData } from "./constant/FastCarMetaData";
import { ApplicationConfig } from "./config/ApplicationConfig";
import { ComponentKind } from "./constant/ComponentKind";
import { CommonConstant, FileResSuffix } from "./constant/CommonConstant";
import { LifeCycleModule } from "./constant/LifeCycleModule";
import * as fs from "fs";
import { AppStatusEnum } from "./constant/AppStatusEnum";
import ValidationUtil from "./utils/ValidationUtil";
import Component from "./annotation/stereotype/Component";
import WinstonLogger from "./model/WinstonLogger";
import * as winston from "winston";
import Logger from "./interface/Logger";
import { ComponentDesc } from "./type/ComponentDesc";
import DateUtil from "./utils/DateUtil";
import { ProcessType } from "./type/ProcessType";

@Component
class FastCarApplication extends Events {
	protected componentMap: Map<string | symbol, any>; //组件键值对
	protected sysConfig: SYSConfig; //系统配置
	protected basePath!: string; //入口文件夹路径
	protected baseFileName!: string; //入口文件路径
	protected loggerFactory!: WinstonLogger;
	protected applicationStatus: AppStatusEnum;
	protected sysLogger!: winston.Logger;
	protected componentDeatils: Map<string | symbol, ComponentDesc>; //读取路径  名称
	protected liveTime: number;

	constructor() {
		super();

		this.sysConfig = SYSDefaultConfig;
		this.componentMap = new Map();
		this.componentDeatils = new Map();
		this.applicationStatus = AppStatusEnum.READY;
		this.liveTime = Date.now();

		this.loadSelf();
		this.addHot();
	}

	/***
	 * @version 1.0 根据原型加载注入的方法
	 *
	 */
	getInjectionUniqueKey(target: Object): string {
		let key = Reflect.getMetadata(FastCarMetaData.InjectionUniqueKey, target);
		return key;
	}

	loadSelf(): void {
		let key = this.getInjectionUniqueKey(FastCarApplication);
		this.componentMap.set(key, this);
		this.componentDeatils.set("FastCarApplication", {
			id: key,
			name: "FastCarApplication",
			path: __filename,
		});
		//暴露一个全局的app 以便调用
		Reflect.set(global, CommonConstant.FastcarApp, this);
	}

	/***
	 * @version 1.0 热更新组件
	 */
	addHot() {
		this.on("reload", (fp: string) => {
			if (this.applicationStatus != AppStatusEnum.RUN) {
				return;
			}

			let moduleClass = ClassLoader.loadModule(fp, true);
			if (moduleClass != null) {
				moduleClass.forEach((func, name) => {
					this.convertInstance(func, name);
				});
			}
		});
	}

	/***
	 * @version 1.0 获取资源路径
	 */
	getResourcePath(): string {
		let resourcePath = path.join(this.basePath, "../", CommonConstant.Resource);
		return resourcePath;
	}

	/***
	 * @version 1.0 获取项目的基本路径
	 *
	 */
	getBasePath(): string {
		return this.basePath;
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
					Object.keys(addConfig).forEach((key) => {
						let afterConfig = addConfig[key];
						let beforeConfig = this.sysConfig.settings.get(key);
						if (beforeConfig) {
							//对settings的属性进行覆盖
							afterConfig = Object.assign(beforeConfig, afterConfig);
						}
						this.sysConfig.settings.set(key, afterConfig);
					});
				} else {
					Object.assign(currConfig, addConfig);
				}
			}
		};

		FileResSuffix.forEach((suffix) => {
			let fileContent = FileUtil.getResource(path.join(resPath, `${configName}.${suffix}`));
			if (fileContent) {
				replaceSetting(CommonConstant.Settings, fileContent);

				replaceSetting(CommonConstant.Application, fileContent);

				//将application和sesstings进行删除
				Reflect.deleteProperty(fileContent, CommonConstant.Application);
				Reflect.deleteProperty(fileContent, CommonConstant.Settings);

				//追加自定的属性
				MixTool.copyProperties(sysConfig, fileContent);
			}
		});
	}

	/***
	 * @version 1.0 加载系统配置 加载顺序为 default json < yaml < env
	 *
	 */
	loadSysConfig() {
		this.updateSysConfig(this.sysConfig, CommonConstant.Application);

		let env = Reflect.get(this, CommonConstant.ENV) || this.sysConfig.application.env;

		this.updateSysConfig(this.sysConfig, `${CommonConstant.Application}-${env}`);

		//自定义环境变量设置
		process.env.NODE_ENV = env;

		//读取app的必要信息 name和版本号 根据 package.json
		let packagePath = path.join(this.basePath, "../", "package.json");
		if (fs.existsSync(packagePath)) {
			let packageInfo = require(packagePath);
			if (packageInfo.name) {
				this.sysConfig.application.name = packageInfo.name;
			}
			if (packageInfo.version) {
				this.sysConfig.application.version = packageInfo.version;
			}
		}
	}

	setSetting(key: string | symbol, value: any) {
		this.sysConfig.settings.set(key, value);
	}

	/***
	 * @version 1.0 获取自定义设置 设置优先级 配置自定义>系统配置>初始化
	 *
	 */
	getSetting(key: string | symbol): any {
		let res = this.sysConfig.settings.get(key);
		if (ValidationUtil.isNotNull(res)) {
			return res;
		}

		res = Reflect.get(this.sysConfig, key);
		if (ValidationUtil.isNotNull(res)) {
			res;
		}

		return Reflect.get(this, key);
	}

	/***
	 * @version 1.0 获取应用配置
	 */
	getapplicationConfig(): ApplicationConfig {
		return this.sysConfig.application;
	}

	/***
	 * @version 1.0 扫描组件
	 * @version 1.1 新增手动注入组件
	 * @version 1.2 改成统一入口
	 */
	loadClass() {
		//加载文件扫描下的bean
		let tmpFilePath: string[] = Array.of();
		let includeList: string[] = Reflect.get(this, FastCarMetaData.ComponentScan);

		if (includeList) {
			includeList.forEach((item) => {
				let tmpList = FileUtil.getFilePathList(item);
				tmpFilePath = tmpFilePath.concat(tmpList);
			});
		}

		let filePathList = FileUtil.getFilePathList(this.basePath);
		filePathList = tmpFilePath.concat(filePathList);
		filePathList = [...new Set(filePathList)];

		let excludeList: string[] = Reflect.get(this, FastCarMetaData.ComponentScanExclusion);
		if (excludeList) {
			let excludAllPath: string[] = [];
			excludeList.forEach((item) => {
				let exlist = FileUtil.getFilePathList(item);
				excludAllPath = [...excludAllPath, ...exlist];
			});

			filePathList = filePathList.filter((item) => {
				return !excludAllPath.includes(item);
			});
		}

		let resp = this.getResourcePath();
		for (let f of filePathList) {
			if (f == this.baseFileName) {
				continue;
			}

			//如果是资源路径下的则自动过滤掉
			if (f.startsWith(resp)) {
				continue;
			}

			let moduleClass = ClassLoader.loadModule(f);
			if (moduleClass != null) {
				moduleClass.forEach((func, name) => {
					if (this.componentMap.has(name)) {
						let repeatError = new Error(`Duplicate ${name} instance objects are not allowed `);
						this.sysLogger.error(repeatError.message);
						throw repeatError;
					}

					this.convertInstance(func, f);
				});
			}
		}
	}

	/***
	 * @version 1.0 转成实例对象
	 * @version 1.0.1 新增加载时识别载入配置选项
	 *
	 */
	convertInstance(classZ: any, fp: string) {
		//只有依赖注入的组件才能被实例化
		let instanceKey = Reflect.getMetadata(FastCarMetaData.InjectionUniqueKey, classZ);
		if (!!instanceKey) {
			let beforeInstance = this.componentMap.get(instanceKey);
			if (!!beforeInstance) {
				MixTool.assign(beforeInstance, classZ);
				return;
			}

			//判断是否需要加载对应配置
			let cp = Reflect.getMetadata(LifeCycleModule.LoadConfigure, classZ);

			if (cp) {
				let rfp = path.join(this.getResourcePath(), cp);
				let tmpConfig = FileUtil.getResource(rfp);

				//进行实例化赋值
				if (tmpConfig) {
					//进行赋值不改变基础属性
					if (TypeUtil.isFunction(classZ)) {
						MixTool.copPropertyValue(classZ.prototype, tmpConfig);
					} else {
						MixTool.copPropertyValue(classZ, tmpConfig);
					}
				}
			}

			let instance = TypeUtil.isFunction(classZ) ? new classZ() : classZ;
			this.componentMap.set(instanceKey, instance);
			this.componentDeatils.set(instanceKey, {
				id: instanceKey,
				name: classZ?.name || FileUtil.getFileName(fp),
				path: fp,
			});

			//判断是否有别名
			let aliasName = Reflect.getMetadata(FastCarMetaData.Alias, instance);
			if (aliasName) {
				this.componentMap.set(aliasName, instance);
				this.componentDeatils.set(aliasName, {
					id: aliasName,
					name: aliasName,
					path: fp,
				});
			}

			//判断是否需要热更加载
			if (this.isHotter() || Reflect.getMetadata(FastCarMetaData.Hotter, instance)) {
				ClassLoader.watchServices(fp, this);
			}
		}
	}

	/***
	 * @version 1.0 装配模块
	 * @version 1.0 装配日志模块
	 */
	injectionModule(instance: any, instanceName: string | symbol): void {
		let relyname = FastCarMetaData.IocModule;
		let moduleList: Map<string, string> = Reflect.getMetadata(relyname, instance);
		let detailInfo = this.componentDeatils.get(instanceName);

		if (moduleList && moduleList.size > 0) {
			moduleList.forEach((name: string, propertyKey: string) => {
				let func = this.componentMap.get(name);

				//如果等于自身则进行注入
				if (name === FastCarApplication.name || name === FastCarMetaData.APP) {
					func = this;
				} else {
					if (!this.componentMap.has(name)) {
						//找不到依赖项
						let injectionError = new Error(`Unsatisfied dependency expressed through [${propertyKey}] in ${detailInfo?.path} `);
						this.sysLogger.error(injectionError.message);
						throw injectionError;
					}
				}

				Reflect.set(instance, propertyKey, func);
			});
		}

		let loggerSet: Map<string, string> = Reflect.getMetadata(FastCarMetaData.LoggerModule, instance);
		if (loggerSet) {
			loggerSet.forEach((loggerName, propertyKey) => {
				let logger = this.loggerFactory.getLogger(loggerName);
				if (!logger) {
					this.loggerFactory.addLogger(loggerName);
				}

				Reflect.set(instance, propertyKey, this.loggerFactory.getLogger(loggerName));
			});
		}
	}

	/**
	 * @version 1.0 加载需要注入的类
	 */
	loadInjectionModule() {
		this.componentMap.forEach((instance, instanceName) => {
			//补充实例找不到时 不能被注解
			if (!instance) {
				let insatnceError = new Error(`instance not found by ${instanceName.toString()}`);
				this.sysLogger.error(insatnceError.message);
				throw insatnceError;
			}

			this.injectionModule(instance, instanceName);
		});
	}

	/***
	 * @version 1.0 根据类型获取组件
	 */
	getComponentByType(name: ComponentKind): any[] {
		let instanceList: any[] = Array.of();
		this.componentMap.forEach((instance) => {
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
	getComponentList(): any[] {
		return [...this.componentMap.values()];
	}

	/***
	 * @version 1.0 根据名称组件
	 */
	getComponentByName(name: string | symbol): any {
		return this.componentMap.get(name);
	}

	/***
	 * @version 1.0 根据原型获取实例
	 */
	getComponentByTarget(target: Object): any {
		let key = this.getInjectionUniqueKey(target);
		return this.componentMap.get(key);
	}

	/**
	 * @version 1.0 获取组件详情列表
	 *
	 */
	getComponentDetailsList(): ComponentDesc[] {
		return [...this.componentDeatils.values()];
	}

	/***
	 * @version 1.0 根据名称获取组件的加载情况
	 *
	 */
	getComponentDetailByName(name: string | symbol): ComponentDesc | undefined {
		return this.componentDeatils.get(name);
	}

	/***
	 * @version 1.0 根据原型获取组件的加载信息
	 *
	 */
	getComponentDetailByTarget(target: Object): ComponentDesc | undefined {
		let key = this.getInjectionUniqueKey(target);
		return this.componentDeatils.get(key);
	}

	/**
	 * @version 1.0 开启日志系统
	 * @version 1.1 更改为采用winston日志
	 */
	startLog() {
		let logConfig = this.getSetting("log");
		let defaultConfig = Object.assign({}, LogDefaultConfig, { rootPath: path.join(this.basePath, "../logs") });
		if (logConfig) {
			Object.assign(defaultConfig, logConfig);
		}

		this.loggerFactory = new WinstonLogger(defaultConfig);
		//添加系统日志
		this.sysLogger = this.loggerFactory.addLogger(CommonConstant.SYSLOGGER);
	}

	/***
	 * @version 1.0 初始化应用
	 */
	init() {
		//加载配置
		this.basePath = Reflect.get(this, CommonConstant.BasePath) || require.main?.path || module.path;
		this.baseFileName = Reflect.get(this, CommonConstant.BaseFileName) || require.main?.filename || module.filename;

		this.beforeStartServer();
		this.startServer();
		this.addExitEvent();
		this.addExecptionEvent();
	}

	async exitEvent(msg: string) {
		//防止多次停止 原则上不会发生
		if (this.applicationStatus == AppStatusEnum.RUN) {
			this.applicationStatus = AppStatusEnum.STOP;
			this.sysLogger.info("exit reason", msg);
			await this.beforeStopServer();
			process.exit();
		}
	}

	addExitEvent() {
		process.on("beforeExit", () => {
			this.exitEvent("beforeExit exit");
		});

		process.on("SIGINT", () => {
			this.exitEvent("sigint exit");
		});

		process.on("message", async (msg) => {
			if (msg == "shutdown") {
				this.exitEvent("shutdown");
			}
		});

		process.on("exit", () => {
			this.stopServer();
		});
	}

	addExecptionEvent() {
		process.on("uncaughtException", (err: any, origin: any) => {
			this.sysLogger.error(`Caught exception: ${err.message}`);
			this.sysLogger.error(`Exception origin: ${origin}`);
			this.sysLogger.error(`stack: ${err.stack}`);
		});

		process.on("unhandledRejection", (reason, promise) => {
			this.sysLogger.error("Unhandled Rejection at:", promise);
			this.sysLogger.error("reason:", reason);
		});
	}

	/***
	 * @version 1.0 自动调用方法
	 */
	async automaticRun(name: LifeCycleModule) {
		let list = [];
		for (let [key, item] of this.componentMap) {
			let runInfo = Reflect.hasMetadata(name, item);
			if (runInfo) {
				let { order, exec } = Reflect.getMetadata(name, item);
				if (TypeUtil.isFunction(item[exec])) {
					list.push({
						order,
						exec,
						item,
					});
				}
			}
		}

		list.sort((a, b) => {
			return a.order - b.order;
		});

		for (let { exec, item } of list) {
			let fn = item[exec];

			if (TypeUtil.isPromise(fn)) {
				await Promise.resolve(Reflect.apply(fn, item, []));
			} else {
				Reflect.apply(fn, item, []);
			}
		}
	}

	/**
	 * @version 1.0 开启应用前执行的操作 加载配置,扫描组件，注入依赖组件
	 */
	beforeStartServer() {
		//加载日志
		this.loadSysConfig();

		//开启日志
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

		this.sysLogger.info(`start server ${this.sysConfig.application.name} is run`);
		this.sysLogger.info(`version ${this.sysConfig.application.version}`);
		this.applicationStatus = AppStatusEnum.RUN;

		if (process.send && TypeUtil.isFunction(process.send)) {
			process.send("ready");
		}
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

	/**
	 * @version 1.0 获取app名称
	 */
	getApplicationName(): string {
		return this.sysConfig.application.name;
	}

	/***
	 * @version 1.0 获取系统日志
	 *
	 */
	getSysLogger(): Logger {
		return this.sysLogger;
	}

	/***
	 * @version 1.0 获取文件内容
	 */
	getFileContent(fp: string): string {
		if (!fs.existsSync(fp)) {
			fp = path.join(this.getResourcePath(), fp);
			if (!fs.existsSync(fp)) {
				return "";
			}
		}

		let currStats = fs.statSync(fp);
		if (!currStats.isFile()) {
			return "";
		}

		return fs.readFileSync(fp).toString();
	}

	/***
	 * @version 1.0 是否支持热更
	 *
	 */
	isHotter(): boolean {
		return !!this.getSetting("hotter");
	}

	/***
	 * @version 1.0 指定热更新文件
	 *
	 */
	specifyHotUpdate(fp: string): void {
		if (fs.existsSync(fp)) {
			this.emit("reload", fp);
		}
	}

	/***
	 * @version 1.0 获取进程的信息
	 *
	 */
	getMemoryUsage(): ProcessType {
		let { rss, heapTotal, heapUsed, arrayBuffers, external } = process.memoryUsage();

		return {
			pid: process.pid, //进程id
			name: this.sysConfig.application.name,
			env: this.sysConfig.application.env,
			version: this.sysConfig.application.version,
			rss: FileUtil.formatBytes(rss), //常住集大小
			heapTotal: FileUtil.formatBytes(heapTotal), //V8 的内存使用量
			heapUsed: FileUtil.formatBytes(heapUsed),
			arrayBuffers: FileUtil.formatBytes(arrayBuffers), //包含所有的Buffer
			external: FileUtil.formatBytes(external), //绑定到 V8 管理的 JavaScript 对象的 C++ 对象的内存使用量
			uptime: DateUtil.getTimeStr(Date.now() - this.liveTime), //运行时间
		};
	}
}

export default FastCarApplication;
