import "reflect-metadata";
import * as fs from "fs";
import * as process from "process";
import * as Events from "events";
import * as path from "path";
import ClassLoader from "./utils/ClassLoader";
import FileUtil from "./utils/FileUtil";
import MixTool from "./utils/Mix";
import TypeUtil from "./utils/TypeUtil";
import { LogDefaultConfig, SYSConfig, SYSDefaultConfig } from "./config/SysConfig";
import { FastCarMetaData } from "./constant/FastCarMetaData";
import { ApplicationConfig } from "./config/ApplicationConfig";
import { ComponentKind } from "./constant/ComponentKind";
import { CommonConstant } from "./constant/CommonConstant";
import { LifeCycleModule } from "./constant/LifeCycleModule";
import { AppStatusEnum } from "./constant/AppStatusEnum";
import ValidationUtil from "./utils/ValidationUtil";
import Component from "./annotation/stereotype/Component";
import WinstonLogger from "./model/WinstonLogger";
import * as winston from "winston";
import Logger from "./interface/Logger";
import { ComponentDesc, InjectionMeta } from "./type/ComponentDesc";
import DateUtil from "./utils/DateUtil";
import { ProcessType } from "./type/ProcessType";
import { FileHotterDesc, HotReloadEnum } from "./type/FileHotterDesc";
import { LifeCycleType } from "./annotation/lifeCycle/AddLifeCycleItem";
import { WinstonLoggerType } from "./type/WinstonLoggerType";
import { ClassConstructor } from "./type/ClassConstructor";
import ReflectUtil from "./utils/ReflectUtil";
import Log from "./annotation/stereotype/Log";

@Component
class FastCarApplication extends Events {
	protected componentMap: Map<string | symbol, ClassConstructor<Object> | Object>; //组件键值对
	protected sysConfig: SYSConfig; //系统配置
	protected basePath!: string; //入口文件夹路径
	protected baseFileName!: string; //入口文件路径
	protected loggerFactory!: WinstonLogger;
	protected applicationStatus: AppStatusEnum;

	@Log("sys")
	protected sysLogger: Logger;

	protected componentDeatils: Map<string | symbol, ComponentDesc>; //读取路径  名称
	protected liveTime: number;
	protected watchFiles: Map<string, FileHotterDesc[]>;
	protected resourcePath: string = ""; //资源路径
	protected delayHotIds: Map<string, { fp: string; loadType: HotReloadEnum }>;
	protected reloadTimerId: NodeJS.Timeout | null;
	protected basename: string = CommonConstant.Application;
	protected componentAliasMap: Map<string | symbol, string | symbol>;
	protected hotConfigure: Map<string, string[]>;

	constructor() {
		super();

		this.sysConfig = SYSDefaultConfig;
		this.componentMap = new Map();
		this.componentDeatils = new Map();
		this.applicationStatus = AppStatusEnum.READY;
		this.liveTime = Date.now();
		this.watchFiles = new Map();
		this.delayHotIds = new Map();
		this.reloadTimerId = null;
		this.componentAliasMap = new Map();
		this.hotConfigure = new Map();

		this.sysLogger = console;

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
			classZ: this,
		});
		//暴露一个全局的app 以便调用
		Reflect.set(global, CommonConstant.FastcarApp, this);
	}

	/***
	 * @version 1.0 热更新组件
	 * @version 1.1 热更新配置文件
	 */
	addHot() {
		this.on(HotReloadEnum.reload, (fp: string) => {
			if (this.applicationStatus != AppStatusEnum.RUN) {
				return;
			}

			this.addDelayHot(fp, HotReloadEnum.reload);
		});

		this.on(HotReloadEnum.sysReload, (fp: string) => {
			if (fp.indexOf(this.basename) != -1) {
				this.addDelayHot(fp, HotReloadEnum.sysReload);
			}
		});

		this.on(HotReloadEnum.configReload, (fp: string) => {
			this.addDelayHot(fp, HotReloadEnum.configReload);
		});
	}

	addDelayHot(fp: string, loadType: HotReloadEnum) {
		if (this.delayHotIds.has(fp)) {
			return;
		}
		this.delayHotIds.set(fp, {
			fp,
			loadType,
		});
		if (!this.reloadTimerId) {
			this.reloadTimerId = setTimeout(() => {
				this.reloadFiles();
			}, 1000);
		}
	}

	reloadFiles() {
		this.delayHotIds.forEach(({ fp, loadType }) => {
			switch (loadType) {
				case HotReloadEnum.reload: {
					let moduleClass = ClassLoader.loadModule(fp, true);
					this.sysLogger.info("hot update---" + fp);
					if (moduleClass != null) {
						moduleClass.forEach((func) => {
							this.convertInstance(func, fp);
						});
					}
					break;
				}
				case HotReloadEnum.sysReload: {
					this.sysLogger.info("sysConfig hot update----" + fp);
					this.loadSysConfig();
					break;
				}
				case HotReloadEnum.configReload: {
					let ids = this.hotConfigure.get(fp);
					if (ids) {
						ids.forEach((item) => {
							let instance = this.getComponentByName(item);
							if (instance) {
								this.updateConfig(instance, fp);
							}
						});
					}
					break;
				}
				default: {
					this.sysLogger.warn(`not found ${loadType} by ${fp}`);
					break;
				}
			}
		});

		this.delayHotIds.clear();
		this.reloadTimerId = null;
	}

	/***
	 * @version 1.0 获取资源路径
	 */
	getResourcePath(): string {
		if (!!this.resourcePath) {
			return this.resourcePath;
		}
		let resourcePath = path.join(this.basePath, "../", CommonConstant.Resource);
		this.resourcePath = resourcePath;
		return resourcePath;
	}

	/***
	 * @version 1.0 获取项目的基本路径
	 *
	 */
	getBasePath(): string {
		return this.basePath;
	}

	/**
	 * @version 1.0 获取项目读取的基本配置路径
	 */
	getBaseName(): string {
		return this.basename;
	}

	/***
	 * @version 1.0 加载系统配置 加载顺序为 default json < yaml < env
	 *
	 */
	loadSysConfig() {
		this.sysConfig = FileUtil.getApplicationConfig(this.getResourcePath(), this.basename, this.sysConfig);

		let env = (Reflect.get(this, CommonConstant.ENV) || this.sysConfig.application.env || "devlopment") as string;

		this.sysConfig = FileUtil.getApplicationConfig(this.getResourcePath(), `${this.basename}-${env}`, this.sysConfig);

		//自定义环境变量设置
		process.env.NODE_ENV = env;

		//判断程序内是否有配置
		let applicationSesstings: Map<string, any> = Reflect.getMetadata(CommonConstant.FastcarSetting, this);
		if (applicationSesstings) {
			applicationSesstings.forEach((value, key) => {
				let afterConfig = value;
				let beforeConfig = this.sysConfig.settings.get(key);
				if (beforeConfig) {
					//对settings的属性进行覆盖
					if (typeof beforeConfig == "object") {
						afterConfig = Object.assign(beforeConfig, afterConfig);
					}
				}
				this.sysConfig.settings.set(key, afterConfig);
			});
		}

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

	setSetting(key: string | symbol, value: any): void {
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
			return res;
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
		let includeList: string[] = (Reflect.get(this, FastCarMetaData.ComponentScan) as string[]) || [];
		let mustIncludMustList: string[] = (Reflect.get(this, FastCarMetaData.ComponentScanMust) as string[]) || [];

		//从配置文件内读
		if (Array.isArray(this.sysConfig.application?.scan?.include) && this.sysConfig.application?.scan?.include) {
			includeList = [...includeList, ...this.sysConfig.application.scan.include];
		}

		if (includeList.length > 0) {
			includeList.forEach((item) => {
				//获取路径
				let tmpList = FileUtil.getFilePathList(item);
				tmpFilePath = tmpFilePath.concat(tmpList);
			});
		}

		let includeFinalList: string[] = [];
		mustIncludMustList.forEach((item) => {
			let tmpList = FileUtil.getFilePathList(item);
			includeFinalList = includeFinalList.concat(tmpList);
		});

		let filePathList = FileUtil.getFilePathList(this.basePath);

		filePathList = tmpFilePath.concat(filePathList);
		filePathList = [...new Set(filePathList)];

		let excludeList: string[] = (Reflect.get(this, FastCarMetaData.ComponentScanExclusion) as string[]) || [];

		if (Array.isArray(this.sysConfig.application?.scan?.exclude) && this.sysConfig.application?.scan?.exclude) {
			excludeList = [...excludeList, ...this.sysConfig.application.scan.exclude];
		}

		if (excludeList.length > 0) {
			let excludAllPath: string[] = [];
			excludeList.forEach((item) => {
				let exlist = FileUtil.getFilePathList(item);
				excludAllPath = [...excludAllPath, ...exlist];
			});

			filePathList = filePathList.filter((item) => {
				if (includeFinalList.includes(item)) {
					return true;
				}
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

	getInjectionUniqueKeyByFilePath(fp: string, name: string): string | symbol | null {
		let list = this.watchFiles.get(fp);
		if (list) {
			for (let item of list) {
				if (item.name == name) {
					return item.key;
				}
			}
		}

		return null;
	}

	/***
	 * @version 1.0 转成实例对象
	 * @version 1.0.1 新增加载时识别载入配置选项
	 *
	 */
	convertInstance(classZ: any, fp: string) {
		//只有依赖注入的组件才能被实例化
		let Target = classZ;
		let instanceKey = Reflect.getMetadata(FastCarMetaData.InjectionUniqueKey, classZ);
		if (!instanceKey) {
			Target = Reflect.get(classZ, "__target__");
			if (!Target) {
				return;
			}
			instanceKey = Reflect.getMetadata(FastCarMetaData.InjectionUniqueKey, Target);
		}

		if (!!instanceKey) {
			let iname = classZ?.name || FileUtil.getFileName(fp);
			let beforeKey = this.getInjectionUniqueKeyByFilePath(fp, iname);

			if (beforeKey) {
				let beforeInstance = this.getBean(beforeKey);
				if (!!beforeInstance) {
					MixTool.assign(beforeInstance, classZ);
					return;
				}
			}

			//这边只放元数据
			this.componentDeatils.set(instanceKey, {
				id: instanceKey,
				name: classZ?.name || FileUtil.getFileName(fp),
				path: fp,
				classZ,
			});

			//加载Bean
			this.getBean(instanceKey);
		}
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
	getComponentList(): (Object | ClassConstructor<Object>)[] {
		return [...this.componentMap.values()];
	}

	/***
	 * @version 1.0 根据名称组件
	 */
	getComponentByName(name: string | symbol): Object | null {
		if (this.componentMap.has(name)) {
			return this.getBean(name);
		}

		let key = this.componentAliasMap.get(name);
		if (key) {
			return this.getBean(key);
		}

		return null;
	}

	/**
	 * @version 1.0 组件改成按需加载的模式
	 */
	getBean(key: string | symbol): Object | null {
		let instance = this.componentMap.get(key) || null;
		if (!instance) {
			//初始化
			let item = this.componentDeatils.get(key);
			if (!item) {
				return null;
			}

			//判断是否有别名
			let instanceKey = item.id;
			let classZ = item.classZ as ClassConstructor<Object>;
			let instance = TypeUtil.isFunction(classZ) ? new classZ() : classZ;

			let hotter = this.isHotter();
			if (!hotter) {
				if (classZ?.prototype && Reflect.getMetadata(FastCarMetaData.Hotter, classZ.prototype)) {
					hotter = true;
				}
			}

			//加载配置
			let cp = Reflect.getMetadata(LifeCycleModule.LoadConfigure, classZ);
			if (cp) {
				let rfp = path.join(this.getResourcePath(), cp);
				this.updateConfig(instance, rfp);

				if (hotter) {
					//监听资源文件
					this.setHotConfigures(rfp, instanceKey);
					ClassLoader.watchServices(rfp, this, HotReloadEnum.configReload);
				}
			}

			this.loadInjectionService(instance);

			this.loadLoggerIOC(instance);

			let aliasName = Reflect.getMetadata(FastCarMetaData.Alias, instance);
			if (aliasName) {
				this.componentAliasMap.set(aliasName, instanceKey);
			}

			let fp = item.path;
			let iname = classZ?.name || FileUtil.getFileName(fp);

			//判断是否需要热更加载
			if (hotter) {
				let fpObj = this.watchFiles.get(fp);
				let fpdesc = {
					key: instanceKey,
					name: iname,
				};
				if (!fpObj) {
					fpObj = [fpdesc];
					ClassLoader.watchServices(fp, this);
					this.watchFiles.set(fp, fpObj);
				} else {
					fpObj.push(fpdesc);
				}
			}

			this.componentMap.set(key, instance);
		}

		return instance;
	}

	public loadInjectionService(instance: Object) {
		let injectionIds: Array<InjectionMeta> = Reflect.getMetadata(FastCarMetaData.InjectionSingleInstance, instance);
		if (injectionIds && injectionIds.length > 0) {
			injectionIds.forEach((item) => {
				Reflect.defineProperty(instance, item.key, {
					get: () => {
						let key = ReflectUtil.getNameByPropertyKey(instance, item.alias || item.key);
						if (!this.hasComponentByName(key)) {
							//找不到依赖组件异常
							let injectionError = new Error(`Unsatisfied dependency expressed through [${item.key}] `);
							throw injectionError;
						}

						return this.getComponentByName(key);
					},
				});
			});
		}
	}

	public loadLoggerIOC(instance: Object) {
		let logIds: Array<{
			propertyKey: string;
			name: string;
		}> = Reflect.getMetadata(FastCarMetaData.InjectionLog, instance);

		if (logIds && logIds.length > 0) {
			logIds.forEach((item) => {
				Reflect.defineProperty(instance, item.propertyKey, {
					get: (): Logger => {
						let appid = this.getSetting(CommonConstant.APPId) || ""; //进行差异化区分
						return this.getLogger(appid ? `${appid}.${item.name}` : item.name);
					},
				});
			});
		}
	}

	private updateConfig(instance: Object, fp: string) {
		let tmpConfig = FileUtil.getResource(fp);

		//进行实例化赋值
		if (tmpConfig) {
			MixTool.copPropertyValue(instance, tmpConfig);
		}
	}

	private setHotConfigures(fid: string, servicePath: string) {
		let list = this.hotConfigure.get(fid);
		if (!list) {
			list = [];
			this.hotConfigure.set(fid, list);
		}

		if (!list.includes(servicePath)) {
			list.push(servicePath);
		}
	}

	/***
	 * @version 1.0 判断是否拥有组件名称
	 */
	hasComponentByName(name: string | symbol): boolean {
		return this.componentMap.has(name) || this.componentAliasMap.has(name as string);
	}

	/***
	 * @version 1.0 根据原型获取实例
	 */
	getComponentByTarget<T>(target: Object): T | null {
		let key = this.getInjectionUniqueKey(target);
		let bean = this.getBean(key);

		return bean != null ? (bean as T) : null;
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
		if (this.componentDeatils.has(name)) {
			return this.componentDeatils.get(name);
		}

		let key = this.componentAliasMap.get(name);
		if (key) {
			return this.componentDeatils.get(key);
		}

		return undefined;
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
		let defaultConfig: WinstonLoggerType = Object.assign({}, LogDefaultConfig, { rootPath: path.join(this.basePath, "../logs") });
		if (logConfig) {
			Object.assign(defaultConfig, logConfig);
		}

		this.loggerFactory = new WinstonLogger(defaultConfig);
	}

	/***
	 * @version 1.0 初始化应用
	 */
	init() {
		//加载配置
		this.basePath = (Reflect.get(this, CommonConstant.BasePath) || require.main?.path || module.path || process.cwd()) as string;
		this.baseFileName = (Reflect.get(this, CommonConstant.BaseFileName) || require.main?.filename || module.filename) as string;

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
		let list: (LifeCycleType & { item: any })[] = [];
		this.componentMap.forEach((item) => {
			let runInfo = Reflect.hasMetadata(name, item);
			if (runInfo) {
				let childList: LifeCycleType[] = Reflect.getMetadata(name, item);
				childList.forEach((citem) => {
					list.push({
						order: citem.order,
						exec: citem.exec,
						item,
					});
				});
			}
		});

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

		//监听系统配置
		if (this.isHotterSysConfig()) {
			ClassLoader.watchServices(this.getResourcePath(), this, HotReloadEnum.sysReload);
		}

		//开启日志
		this.startLog();

		this.loadLoggerIOC(this);

		this.sysLogger.info("Start scanning component");
		this.loadClass();
		this.sysLogger.info("Complete component scan");
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
	 * @version 1.0 是否支持资源文件热更
	 */
	isHotterSysConfig(): boolean {
		return !!this.getSetting(FastCarMetaData.HotterSysConfig);
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

	getLogger(category = CommonConstant.SYSLOGGER): winston.Logger {
		let logger = this.loggerFactory.getLogger(category);
		if (!logger) {
			return this.loggerFactory.addLogger(category);
		}

		return logger;
	}
}

export default FastCarApplication;
