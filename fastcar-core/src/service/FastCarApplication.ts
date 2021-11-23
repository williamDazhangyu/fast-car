import 'reflect-metadata';
import * as path from 'path';
import ClassLoader from '../utils/classLoader';
import FileUtil from '../utils/FileUtil';
import Format from '../utils/Format';
import MixTool from '../utils/Mix';
import { FastCarExceptionHandlerService } from '../../../fastcar-koa/src/HandlerServiceImpl';
import HandlerServiceBase from '../interface/HandlerServiceBase';
import TypeUtil from '../utils/TypeUtil';
import ReplaceConsle from '../utils/ReplaceConsle';
import * as process from 'process';
import {SYSConfig, SYSDefaultConfig} from '../config/SysConfig';
import { FastCarMetaData } from '../constant/FastCarMetaData';
import { ApplicationConfig } from '../config/ApplicationConfig';
import { InstanceKind } from '../constant/InstanceKind';
import { LogConfig } from '../config/LogConfig';

const fileResSuffix = ['json', 'yml', 'js']; //文件资源后缀名

class FastCarApplication {

   instanceCollection: Map<string, any>; //实例化的对象
   sysConfig: SYSConfig;
   basePath: string;
   baseFileName: string;
   routes: any;
   containerServer: Map<string, any>;
   handlerService: Map<string, any>; //处理特殊事件存放

   //加载组件
   constructor() {

      this.sysConfig = SYSDefaultConfig;
      this.instanceCollection = new Map();
      this.basePath = module.path;
      this.baseFileName = module.filename;
      this.containerServer = new Map();
      this.handlerService = new Map();

      this.init();
   }

   async init() {

      process.on('uncaughtException', (err: any, origin: any) => {

         console.error(`Caught exception: ${err}`);
         console.error(`Exception origin: ${origin}`);
      });

      process.on('unhandledRejection', (reason, promise) => {

         console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      });

      await this.beforeStartServer();
      await this.startServer();
      await this.afterStartServer();
   }

   //获取资源路径
   getResourcePath() {

      let resourcePath = path.join(this.basePath, 'resource');
      return resourcePath;
   }

   updateSysConfig(sysConfig: SYSConfig, headConfig: string) {

      let resPath = this.getResourcePath();
      fileResSuffix.forEach((s) => {

         let fileContent = FileUtil.getResource(path.join(resPath, `${headConfig}.${s}`));
         if (fileContent) {

            //对于settings做特殊处理
            let addSesstings = Reflect.get(fileContent, 'settings');
            if (addSesstings) {

               let beforeSettings = sysConfig.settings;
               Reflect.deleteProperty(fileContent, 'settings');
               Object.keys(addSesstings).forEach(key => {

                  beforeSettings.set(key, addSesstings[key]);
               });
            }

            let addApplication = Reflect.get(fileContent, 'applicaion');
            if (addApplication) {

               let beforeApplication = sysConfig.applicaion;
               Reflect.deleteProperty(fileContent, 'applicaion');
               Object.assign(beforeApplication, addApplication);
            }

            MixTool.copyProperties(sysConfig, fileContent);
         }
      });
   }

   /***
    * @version 1.0 加载系统配置
    * @param 加载顺序为 default json < yaml < env
    */
   loadSysConfig() {

      this.updateSysConfig(this.sysConfig, 'application');
      let env = Reflect.getMetadata('ENV', this) || this.sysConfig.applicaion.env;
      this.updateSysConfig(this.sysConfig, `application-${env}`);
   }

   /**
    * @version 1.0 开启日志系统
    */
   startLog() {

      let logconfig: LogConfig = this.getSetting('log4js');
      if (!!logconfig) {

         //导入日志模块
         let log4js = require('log4js');
         log4js.configure(logconfig);

         Object.keys(logconfig.appenders).forEach((key) => {

            //加入服务
            this.instanceCollection.set(Format.formatFirstToUp(key), log4js.getLogger(key));
         });

         ReplaceConsle(log4js.getLogger(), logconfig.replaceConsole);
      }
   }

   loadDefaultHandlerService() {

      // this.setHandlerService(HANDLER_SERVICE.ExceptionHandlerService,
      //    new FastCarExceptionHandlerService());
   }

   async loadClass() {

      let tmpFilePath: string[] = Array.of();
      let scanPathList: string = Reflect.getMetadata(FastCarMetaData.ScanPathList, this);

      if (scanPathList) {

         for (let s of scanPathList) {

            let tmpList = FileUtil.getFilePathList(s);
            tmpList.reverse();
            tmpFilePath = [...tmpFilePath, ...tmpList];
         }
      }

      let filePathList = FileUtil.getFilePathList(this.basePath);
      filePathList.reverse();
      //排重过滤
      filePathList = [...tmpFilePath, ...filePathList];
      filePathList = [...new Set(filePathList)];

      let excludeList: string[] = Reflect.getMetadata(FastCarMetaData.ScanExcludePathList, this);
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

      //从下往上进行加载
      for (let f of filePathList) {

         //排除自身
         if (f == this.baseFileName) {

            continue;
         }

         //进行导入方法
         let moduleClass = await ClassLoader.loadModule(f);
         if (moduleClass != null) {

            moduleClass.forEach((func, name) => {

               //防止重名
               if (this.instanceCollection.has(name)) {

                  let repeatError = new Error(`Duplicate ${name} instance objects are not allowed `);
                  throw repeatError;
               }

               //判断是否为方法 若为一个方法则只实例化对象
               if (TypeUtil.isFunction(func)) {

                  //只有实例化的组件才能被初始化
                  if (FastCarApplication.hasLoadModuleMap(name)) {

                     this.instanceCollection.set(name, new func());
                  } else {

                     this.instanceCollection.set(name, func);
                  }
                  return;
               }

               this.instanceCollection.set(name, func);
            });
         }
      }

      console.info('加载完毕');
   }

   loadRequireModule() {

      let relyname = FastCarMetaData.IocModule;
      this.instanceCollection.forEach((instance, instanceName) => {

         let moduleList: Set<string> = Reflect.getMetadata(relyname, instance);
         if (!moduleList || moduleList.size == 0) {

            return;
         }
         moduleList.forEach((name: string) => {

            let func = this.instanceCollection.get(name);

            if (name === 'App') {

               func = this;
            } else {

               if (!this.instanceCollection.has(name)) {

                  //找不到依赖项
                  let injectionError = new Error(`Unsatisfied dependency expressed through ${name} in ${instanceName} `);
                  throw injectionError;
               }
            }

            let propertyKey = Format.formatFirstToLow(name);
            Reflect.set(instance, propertyKey, func);
         });
      });

      //进行装配
      console.info('装配完毕');
   }

   loadHandleModule() {

      this.instanceCollection.forEach((instance) => {

         if (Reflect.hasMetadata(FastCarMetaData.HandleModule, instance)) {

            let sname = Reflect.getMetadata(FastCarMetaData.HandleModule, instance);
            this.setHandlerService(sname, instance);
         }
      });
   }

   async loadDataSource() {

      //加载指定的数据驱动
      // let mysqlConfig: MysqlConfig[] = this.getSetting('mysql');
      // if (Array.isArray(mysqlConfig) && mysqlConfig.length > 0) {

      //    let mysqlService: MysqlService = new MysqlService(mysqlConfig);
      //    this.instanceCollection.set('MysqlService', mysqlService);
      // }

      // let redisConfig = this.getSetting('redis');
      // if (Array.isArray(redisConfig) && redisConfig.length > 0) {

      //    let redisService: RedisService = new RedisService(redisConfig);
      //    this.instanceCollection.set('RedisService', redisService);
      // }
   }

   async loadRoute() {

      console.info('loadRoute is nothing');
   }

   getControllerInstance() {

      let instanceList: Object[] = Array.of();
      this.instanceCollection.forEach((instance) => {

         let flag = Reflect.hasMetadata(InstanceKind.Controller, instance);
         if (flag) {

            instanceList.push(instance);
         }
      });

      return instanceList;
   }

   getInstance() {

      let instanceList: Object[] = Array.of();
      this.instanceCollection.forEach((instance, name) => {

         if (FastCarApplication.hasLoadModuleMap(name)) {

            instanceList.push(instance);
         }

      });

      return instanceList;
   }

   getInstanceByName(name: string) {

      return this.instanceCollection.get(name);
   }

   //初始化执行
   async beforeStartServer() {

      this.loadSysConfig();

      this.loadDefaultHandlerService();

      await this.loadClass();

      await this.loadDataSource();

      this.loadRequireModule();

      this.loadHandleModule();

      this.loadRoute();
   }

   //启动服务
   async startServer() {

      //启动完成后加载日志系统
      this.startLog();
      console.info('开启监听端口，暴露服务');
      console.info('start server is run');
      // const exceptionHandler = this.getHandlerService(HANDLER_SERVICE.ExceptionHandlerService);
      // Reflect.apply(exceptionHandler.handler, this, []);
   }

   //启动服务后加载的逻辑处理
   async afterStartServer() {

      //获取哪些类需要进行初始化的
      this.instanceCollection.forEach((item: any, key: string) => {

         let applicationStart = Reflect.get(item, 'applicationStart');
         if (!!applicationStart) {

            //调用方法或者实例化
            if (TypeUtil.isFunction(item)) {

               let func = new item();
               item = func;
               this.instanceCollection.set(key, func);
            }

            if (Reflect.has(item, 'run')) {

               if (TypeUtil.isFunction(item.run)) {

                  //进行调用
                  Reflect.apply(item.run, item, []);
               }
            }
         }
      });

      console.info('服务应用初始化完成');
   }

   //停止服务前的一些处理操作
   async beforeStopServer() {

      this.instanceCollection.forEach((item: any, key: string) => {

         let applicationStart = Reflect.get(item, 'applicationStop');
         if (!!applicationStart) {

            //调用方法或者实例化
            if (TypeUtil.isFunction(item)) {

               let func = new item();
               item = func;
               this.instanceCollection.set(key, func);
            }

            if (Reflect.has(item, 'run')) {

               if (TypeUtil.isFunction(item.run)) {

                  //进行调用
                  Reflect.apply(item.run, item, []);
               }
            }
         }
      });
   }

   //停止服务
   async stopServer() {


   }

   setSetting(key: string, value: any) {

      this.sysConfig.settings.set(key, value);
   }

   //设置优先级 配置自定义>系统配置>初始化
   getSetting(key: string): any {

      return this.sysConfig.settings.get(key)
         || Reflect.get(this.sysConfig, key)
         || Reflect.get(this, key);
   }

   getApplicaionConfig(): ApplicationConfig {

      return this.sysConfig.applicaion;
   }

   getServerHead() {

      let applicaion = this.getApplicaionConfig();
      let httpHead = applicaion.ssl ? 'https' : 'http';
      let portHead = '';

      if (![80, 443, '80', '443'].includes(applicaion.port)) {

         portHead = ':' + applicaion.port;
      }

      return `${httpHead}://${applicaion.serverIP}${portHead}`;
   }

   getHandlerService(key: string): HandlerServiceBase {

      return this.handlerService.get(key);
   }

   setHandlerService(key: string, fn: Object) {

      this.handlerService.set(key, fn);
   }

   //依赖模块注入
   static setLoadModuleMap(name: string) {

      let loadModule = FastCarMetaData.LoadModuleMap;
      let names: string[] = Reflect.getMetadata(loadModule, FastCarApplication) || [];
      names.push(name);

      Reflect.defineMetadata(loadModule, names, FastCarApplication);
   }

   static hasLoadModuleMap(name: string) {

      let loadModuleName = FastCarMetaData.LoadModuleMap;
      if (!Reflect.hasMetadata(loadModuleName, FastCarApplication)) {

         return false;
      }

      let names = Reflect.getMetadata(loadModuleName, FastCarApplication);
      return names.includes(name);
   }
}

export default FastCarApplication;