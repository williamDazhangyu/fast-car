"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const process = require("process");
const Events = require("events");
const path = require("path");
const classLoader_1 = require("./utils/classLoader");
const FileUtil_1 = require("./utils/FileUtil");
const Format_1 = require("./utils/Format");
const Mix_1 = require("./utils/Mix");
const TypeUtil_1 = require("./utils/TypeUtil");
const SysConfig_1 = require("./config/SysConfig");
const FastCarMetaData_1 = require("./constant/FastCarMetaData");
const CommonConstant_1 = require("./constant/CommonConstant");
const LifeCycleModule_1 = require("./constant/LifeCycleModule");
const log4js = require("log4js");
const fs = require("fs");
class FastCarApplication extends Events {
    constructor() {
        super();
        this.sysConfig = SysConfig_1.SYSDefaultConfig;
        this.componentMap = new Map();
        this.basePath = require.main?.path || module.path;
        this.baseFileName = require.main?.filename || module.filename;
        if (!Reflect.has(this, "log4js")) {
            Reflect.set(this, "log4js", SysConfig_1.LogDefaultConfig);
            log4js.configure(SysConfig_1.LogDefaultConfig);
        }
        this.sysLogger = log4js.getLogger();
        this.componentMap.set("SysLogger", this.sysLogger);
    }
    /***
     * @version 1.0 获取资源路径
     */
    getResourcePath() {
        let resourcePath = path.join(this.basePath, "../", CommonConstant_1.CommonConstant.Resource);
        return resourcePath;
    }
    /***
     * @version 1.0 更新系统配置
     */
    updateSysConfig(sysConfig, configName) {
        let resPath = this.getResourcePath();
        const replaceSetting = (property, fileContent) => {
            let addConfig = Reflect.get(fileContent, property);
            if (addConfig) {
                let currConfig = Reflect.get(sysConfig, property);
                Reflect.deleteProperty(fileContent, property);
                if (CommonConstant_1.CommonConstant.Settings == property) {
                    Object.keys(addConfig).forEach(key => {
                        this.sysConfig.settings.set(key, addConfig[key]);
                    });
                }
                else {
                    Object.assign(currConfig, addConfig);
                }
            }
        };
        CommonConstant_1.FileResSuffix.forEach(suffix => {
            let fileContent = FileUtil_1.default.getResource(path.join(resPath, `${configName}.${suffix}`));
            if (fileContent) {
                replaceSetting(CommonConstant_1.CommonConstant.Settings, fileContent);
                replaceSetting(CommonConstant_1.CommonConstant.Application, fileContent);
                //将application和sesstings进行删除
                Reflect.deleteProperty(fileContent, CommonConstant_1.CommonConstant.Application);
                Reflect.deleteProperty(fileContent, CommonConstant_1.CommonConstant.Settings);
                //追加自定的属性
                Mix_1.default.copyProperties(sysConfig, fileContent);
            }
        });
    }
    /***
     * @version 1.0 加载系统配置
     * @param 加载顺序为 default json < yaml < env
     */
    loadSysConfig() {
        this.updateSysConfig(this.sysConfig, CommonConstant_1.CommonConstant.Application);
        let env = Reflect.get(this, CommonConstant_1.CommonConstant.ENV) || this.sysConfig.application.env;
        this.updateSysConfig(this.sysConfig, `${CommonConstant_1.CommonConstant.Application}-${env}`);
    }
    setSetting(key, value) {
        this.sysConfig.settings.set(key, value);
    }
    /***
     * @version 1.0 获取自定义设置 设置优先级 配置自定义>系统配置>初始化
     *
     */
    getSetting(key) {
        return this.sysConfig.settings.get(key) || Reflect.get(this.sysConfig, key) || Reflect.get(this, key);
    }
    /***
     * @version 1.0 获取应用配置
     */
    getapplicationConfig() {
        return this.sysConfig.application;
    }
    /***
     * @version 1.0 注入需要初始化的组件
     */
    static setInjectionMap(name) {
        let loadModule = FastCarMetaData_1.FastCarMetaData.InjectionMap;
        let names = Reflect.getMetadata(loadModule, FastCarApplication) || [];
        names.push(name);
        Reflect.defineMetadata(loadModule, names, FastCarApplication);
    }
    /***
     * @version 1.0 判断是否已经有初始化的组件了
     */
    static hasInjectionMap(name) {
        let loadModuleName = FastCarMetaData_1.FastCarMetaData.InjectionMap;
        if (!Reflect.hasMetadata(loadModuleName, FastCarApplication)) {
            return false;
        }
        let names = Reflect.getMetadata(loadModuleName, FastCarApplication);
        return names.includes(name);
    }
    /***
     * @version 1.0 指定加载的组件
     *
     */
    static setSpecifyCompent(m) {
        let loadModule = FastCarMetaData_1.FastCarMetaData.SpecifyMap;
        let names = Reflect.getMetadata(loadModule, FastCarApplication) || [];
        if (TypeUtil_1.default.isFunction(m) && names.includes(m.name)) {
            return;
        }
        names.push(m);
        Reflect.defineMetadata(loadModule, names, FastCarApplication);
    }
    /***
     * @version 1.0 扫描组件
     * @version 1.1 新增手动注入组件
     */
    loadClass() {
        //加载特殊的bean
        let specifyCompents = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.SpecifyMap, FastCarApplication);
        if (specifyCompents) {
            specifyCompents.forEach(func => {
                if (TypeUtil_1.default.isFunction(func)) {
                    this.componentMap.set(func.name, new func());
                    return;
                }
                if (func.name) {
                    this.componentMap.set(func.name, func);
                }
            });
        }
        //加载文件扫描下的bean
        let tmpFilePath = Array.of();
        let includeList = Reflect.get(this, FastCarMetaData_1.FastCarMetaData.ComponentScan);
        if (includeList) {
            includeList.forEach(item => {
                let tmpList = FileUtil_1.default.getFilePathList(item);
                tmpFilePath = tmpFilePath.concat(tmpList);
            });
        }
        let filePathList = FileUtil_1.default.getFilePathList(this.basePath);
        filePathList = tmpFilePath.concat(filePathList);
        filePathList = [...new Set(filePathList)];
        let excludeList = Reflect.get(this, FastCarMetaData_1.FastCarMetaData.ComponentScanExclusion);
        if (excludeList) {
            let excludAllPath = [];
            excludeList.forEach(item => {
                let exlist = FileUtil_1.default.getFilePathList(item);
                excludAllPath = [...excludAllPath, ...exlist];
            });
            filePathList = filePathList.filter(item => {
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
            let moduleClass = classLoader_1.default.loadModule(f);
            if (moduleClass != null) {
                moduleClass.forEach((func, name) => {
                    if (this.componentMap.has(name)) {
                        let repeatError = new Error(`Duplicate ${name} instance objects are not allowed `);
                        this.sysLogger.error(repeatError.message);
                        throw repeatError;
                    }
                    //只有依赖注入的组件才能被实例化
                    if (FastCarApplication.hasInjectionMap(name)) {
                        if (TypeUtil_1.default.isFunction(func)) {
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
        let relyname = FastCarMetaData_1.FastCarMetaData.IocModule;
        this.componentMap.forEach((instance, instanceName) => {
            //补充实例找不到时 不能被注解
            if (!instance) {
                let insatnceError = new Error(`instance not found by ${instanceName}`);
                this.sysLogger.error(insatnceError.message);
                throw insatnceError;
            }
            let moduleList = Reflect.getMetadata(relyname, instance);
            if (!moduleList || moduleList.size == 0) {
                return;
            }
            moduleList.forEach((name, propertyKey) => {
                let func = this.componentMap.get(name);
                //如果等于自身则进行注入
                if (name === FastCarApplication.name || name === FastCarMetaData_1.FastCarMetaData.APP) {
                    func = this;
                }
                else {
                    if (!this.componentMap.has(name)) {
                        //找不到依赖项
                        let injectionError = new Error(`Unsatisfied dependency expressed through ${name} in ${instanceName} `);
                        this.sysLogger.error(injectionError.message);
                        throw injectionError;
                    }
                }
                Reflect.set(instance, propertyKey, func);
            });
        });
    }
    /***
     * @version 1.0 根据类型获取组件
     */
    getComponentByType(name) {
        let instanceList = Array.of();
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
    getComponentList() {
        let instanceList = Array.of();
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
    getComponentByName(name) {
        return this.componentMap.get(name);
    }
    /**
     * @version 1.0 开启日志系统
     */
    startLog() {
        let logconfig = this.getSetting("log4js");
        if (logconfig) {
            let existConfig = Reflect.get(this, "log4js");
            if (!!existConfig) {
                logconfig.appenders = Object.assign(existConfig.appenders, logconfig?.appenders);
                logconfig.categories = Object.assign(existConfig.categories, logconfig?.categories);
                logconfig = Object.assign(existConfig, logconfig);
            }
            //导入日志模块
            log4js.configure(logconfig);
            Object.keys(logconfig.categories).forEach(key => {
                //加入服务
                this.componentMap.set(Format_1.default.formatFirstToUp(key), log4js.getLogger(key));
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
        this.addExecptionEvent();
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
    addExecptionEvent() {
        process.on("uncaughtException", (err, origin) => {
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
    async automaticRun(name) {
        let list = [];
        for (let [key, item] of this.componentMap) {
            let runInfo = Reflect.hasMetadata(name, item);
            if (runInfo) {
                let { order, exec } = Reflect.getMetadata(name, item);
                if (TypeUtil_1.default.isFunction(item[exec])) {
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
            if (TypeUtil_1.default.isPromise(fn)) {
                await item[exec]();
            }
            else {
                Reflect.apply(fn, item, []);
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
        await this.automaticRun(LifeCycleModule_1.LifeCycleModule.ApplicationStart);
        this.sysLogger.info("start server is run");
    }
    /***
     * @version 1.0 停止服务前自动调用服务
     */
    async beforeStopServer() {
        this.sysLogger.info("Call the method before the application stops");
        await this.automaticRun(LifeCycleModule_1.LifeCycleModule.ApplicationStop);
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
    getApplicationName() {
        return this.sysConfig.application.name;
    }
    /***
     * @version 1.0 获取系统日志
     *
     */
    getSysLogger() {
        return this.sysLogger;
    }
    /***
     * @version 1.0 获取文件内容
     */
    getFileContent(fp) {
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
}
exports.default = FastCarApplication;
