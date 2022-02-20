"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FastCarApplication_1;
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const process = require("process");
const Events = require("events");
const path = require("path");
const classLoader_1 = require("./utils/classLoader");
const FileUtil_1 = require("./utils/FileUtil");
const FormatStr_1 = require("./utils/FormatStr");
const Mix_1 = require("./utils/Mix");
const TypeUtil_1 = require("./utils/TypeUtil");
const SysConfig_1 = require("./config/SysConfig");
const FastCarMetaData_1 = require("./constant/FastCarMetaData");
const CommonConstant_1 = require("./constant/CommonConstant");
const LifeCycleModule_1 = require("./constant/LifeCycleModule");
const log4js = require("log4js");
const fs = require("fs");
const AppStatusEnum_1 = require("./constant/AppStatusEnum");
const ValidationUtil_1 = require("./utils/ValidationUtil");
const Component_1 = require("./annotation/stereotype/Component");
let FastCarApplication = FastCarApplication_1 = class FastCarApplication extends Events {
    constructor() {
        super();
        this.sysConfig = SysConfig_1.SYSDefaultConfig;
        this.componentMap = new Map();
        let gloabalDir = Reflect.get(global, CommonConstant_1.CommonConstant.BasePath);
        let globalFile = Reflect.get(global, CommonConstant_1.CommonConstant.BaseFileName);
        this.basePath = gloabalDir || require.main?.path || module.path;
        this.baseFileName = globalFile || require.main?.filename || module.filename;
        this.applicationStatus = AppStatusEnum_1.AppStatusEnum.READY;
        this.loadSelf();
        this.addHot();
    }
    /***
     * @version 1.0 根据原型加载注入的方法
     *
     */
    getInjectionUniqueKey(target) {
        let key = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.InjectionUniqueKey, target);
        return key;
    }
    loadSelf() {
        let key = this.getInjectionUniqueKey(FastCarApplication_1);
        this.componentMap.set(key, this);
    }
    /***
     * @version 1.0 热更新组件
     */
    addHot() {
        this.on("reload", (fp) => {
            if (this.applicationStatus != AppStatusEnum_1.AppStatusEnum.RUN) {
                return;
            }
            let moduleClass = classLoader_1.default.loadModule(fp, true);
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
                        let afterConfig = addConfig[key];
                        let beforeConfig = this.sysConfig.settings.get(key);
                        if (beforeConfig) {
                            //对settings的属性进行覆盖
                            afterConfig = Object.assign(beforeConfig, afterConfig);
                        }
                        this.sysConfig.settings.set(key, afterConfig);
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
    setSetting(key, value) {
        this.sysConfig.settings.set(key, value);
    }
    /***
     * @version 1.0 获取自定义设置 设置优先级 配置自定义>系统配置>初始化
     *
     */
    getSetting(key) {
        let res = this.sysConfig.settings.get(key);
        if (ValidationUtil_1.default.isNotNull(res)) {
            return res;
        }
        res = Reflect.get(this.sysConfig, key);
        if (ValidationUtil_1.default.isNotNull(res)) {
            res;
        }
        return Reflect.get(this, key);
    }
    /***
     * @version 1.0 获取应用配置
     */
    getapplicationConfig() {
        return this.sysConfig.application;
    }
    /***
     * @version 1.0 扫描组件
     * @version 1.1 新增手动注入组件
     * @version 1.2 改成统一入口
     */
    loadClass() {
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
    convertInstance(classZ, fp) {
        //只有依赖注入的组件才能被实例化
        let instanceKey = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.InjectionUniqueKey, classZ);
        if (!!instanceKey) {
            let beforeInstance = this.componentMap.get(instanceKey);
            if (!!beforeInstance) {
                Mix_1.default.assign(beforeInstance, classZ);
                return;
            }
            //判断是否需要加载对应配置
            let cp = Reflect.getMetadata(LifeCycleModule_1.LifeCycleModule.LoadConfigure, classZ);
            let instance = TypeUtil_1.default.isFunction(classZ) ? new classZ() : classZ;
            if (cp) {
                let fp = path.join(this.getResourcePath(), cp);
                let tmpConfig = FileUtil_1.default.getResource(fp);
                //进行实例化赋值
                if (tmpConfig) {
                    //进行赋值不改变基础属性
                    Mix_1.default.copPropertyValue(instance, tmpConfig);
                }
            }
            this.componentMap.set(instanceKey, instance);
            //判断是否有别名
            let aliasName = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.Alias, instance);
            if (aliasName) {
                this.componentMap.set(aliasName, instance);
            }
            //判断是否需要热更加载
            if (this.isHotter() || Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.Hotter, instance)) {
                classLoader_1.default.watchServices(fp, this);
            }
        }
    }
    /***
     * @version 1.0 装配模块
     *
     */
    injectionModule(instance) {
        let relyname = FastCarMetaData_1.FastCarMetaData.IocModule;
        let moduleList = Reflect.getMetadata(relyname, instance);
        if (!moduleList || moduleList.size == 0) {
            return;
        }
        moduleList.forEach((name, propertyKey) => {
            let func = this.componentMap.get(name);
            //如果等于自身则进行注入
            if (name === FastCarApplication_1.name || name === FastCarMetaData_1.FastCarMetaData.APP) {
                func = this;
            }
            else {
                if (!this.componentMap.has(name)) {
                    //找不到依赖项
                    let injectionError = new Error(`Unsatisfied dependency expressed through ${propertyKey} in ${instance.name} `);
                    this.sysLogger.error(injectionError.message);
                    throw injectionError;
                }
            }
            Reflect.set(instance, propertyKey, func);
        });
    }
    /**
     * @version 1.0 加载需要注入的类
     */
    loadInjectionModule() {
        this.componentMap.forEach((instance, instanceName) => {
            //补充实例找不到时 不能被注解
            if (!instance) {
                let insatnceError = new Error(`instance not found by ${instanceName}`);
                this.sysLogger.error(insatnceError.message);
                throw insatnceError;
            }
            this.injectionModule(instance);
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
        return [...this.componentMap.values()];
    }
    /***
     * @version 1.0 根据名称组件
     */
    getComponentByName(name) {
        return this.componentMap.get(name);
    }
    /***
     * @version 1.0 根据原型获取实例
     */
    getComponentByTarget(target) {
        let key = this.getInjectionUniqueKey(target);
        return this.componentMap.get(key);
    }
    /**
     * @version 1.0 开启日志系统
     */
    startLog() {
        if (!Reflect.has(this, "log4js")) {
            Reflect.set(this, "log4js", SysConfig_1.LogDefaultConfig);
            log4js.configure(SysConfig_1.LogDefaultConfig);
        }
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
                this.componentMap.set(FormatStr_1.default.formatFirstToUp(key), log4js.getLogger(key));
            });
        }
        //默认追加一个系统日志
        this.sysLogger = log4js.getLogger();
        this.componentMap.set("SysLogger", this.sysLogger);
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
    async exitEvent(msg) {
        //防止多次停止 原则上不会发生
        if (this.applicationStatus == AppStatusEnum_1.AppStatusEnum.RUN) {
            this.applicationStatus = AppStatusEnum_1.AppStatusEnum.STOP;
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
                await Promise.resolve(Reflect.apply(fn, item, []));
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
        await this.automaticRun(LifeCycleModule_1.LifeCycleModule.ApplicationStart);
        this.sysLogger.info(`start server ${this.sysConfig.application.name} is run`);
        this.sysLogger.info(`version ${this.sysConfig.application.version}`);
        this.applicationStatus = AppStatusEnum_1.AppStatusEnum.RUN;
        if (process.send && TypeUtil_1.default.isFunction(process.send)) {
            process.send("ready");
        }
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
    /***
     * @version 1.0 是否支持热更
     *
     */
    isHotter() {
        return !!this.getSetting("hotter");
    }
    /***
     * @version 1.0 指定热更新文件
     *
     */
    specifyHotUpdate(fp) {
        if (fs.existsSync(fp)) {
            this.emit("reload", fp);
        }
    }
};
FastCarApplication = FastCarApplication_1 = __decorate([
    Component_1.default,
    __metadata("design:paramtypes", [])
], FastCarApplication);
exports.default = FastCarApplication;
