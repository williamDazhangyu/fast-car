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
Object.defineProperty(exports, "__esModule", { value: true });
const MongoDataSource_1 = require("./MongoDataSource");
const annotation_1 = require("fastcar-core/annotation");
const fastcar_core_1 = require("fastcar-core");
const SqlConfig_1 = require("../type/SqlConfig");
const db_1 = require("fastcar-core/db");
let MongoDataSourceManager = class MongoDataSourceManager {
    constructor() {
        //进行数据库初始化
        this.sourceMap = new Map();
    }
    async start() {
        let config = this.app.getSetting("mongo");
        if (config) {
            this.config = Object.assign({}, SqlConfig_1.MongoDefaultConfig, config);
            await this.createDataSource();
        }
    }
    async stop() {
        //结束销毁
        for (let [name, db] of this.sourceMap) {
            this.sysLogger.info(`close mongo client By ${name} `);
            await db.close();
        }
        this.sourceMap.clear();
    }
    async connExecute(conn, params) {
        let finalSQL = params
            .map(item => {
            return `${item.method}(${JSON.stringify(item.args)})`;
        })
            .join(".");
        //打印sql
        if (this.config.printSQL) {
            this.sysLogger.info("printSQL", finalSQL);
        }
        //检查sql执行时间
        let beforeTime = Date.now();
        //进行一个链式调用
        let result;
        let next = conn;
        for (let p of params) {
            let fn = Reflect.get(next, p.method);
            result = await Promise.resolve(Reflect.apply(fn, next, p.args));
            next = result;
        }
        let afterTime = Date.now();
        let diff = afterTime - beforeTime;
        if (diff >= this.config.slowSQLInterval) {
            this.sysLogger.warn(`The SQL execution time took ${diff} ms, more than ${this.config.slowSQLInterval} ms`);
            this.sysLogger.warn(finalSQL);
        }
        return result;
    }
    async createDataSource() {
        if (this.config.dataSoucreConfig.length == 0) {
            return;
        }
        for (let item of this.config.dataSoucreConfig) {
            let source = item.source;
            if (this.sourceMap.has(source)) {
                return;
            }
            if (item.default) {
                this.defaultSource = source;
            }
            let tmpConfig = Object.assign({}, item);
            Reflect.deleteProperty(tmpConfig, "source");
            let ds = new MongoDataSource_1.default();
            await ds.createClient(tmpConfig);
            this.sourceMap.set(source, ds);
        }
        if (!this.defaultSource) {
            this.defaultSource = this.config.dataSoucreConfig[0].source;
        }
    }
    getDataSoucreByName(name) {
        return this.sourceMap.get(name);
    }
    getDefaultSoucre() {
        return this.defaultSource;
    }
    //执行sql
    async execute(args) {
        return new Promise(async (resolve, reject) => {
            let ds = args.ds || this.getDefaultSoucre();
            let dataSoucre = this.sourceMap.get(ds);
            if (!dataSoucre) {
                return reject(new Error(`this datasoucre ${ds} cannot be found `));
            }
            try {
                let conn = dataSoucre.getConnection();
                let result = await this.connExecute(conn, args.params);
                return resolve(result);
            }
            catch (e) {
                this.sysLogger.error("sql error:", JSON.stringify(args.params));
                if (e instanceof Error) {
                    this.sysLogger.error("reason:", e.message);
                    this.sysLogger.error("stack:", e.stack);
                }
                return reject(e);
            }
        });
    }
    createSession() {
        throw new db_1.SqlError("createSession not implemented By mongo.");
    }
    destorySession(sessionId, status) {
        throw new db_1.SqlError("destorySession not implemented By mongo.");
    }
};
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", fastcar_core_1.FastCarApplication)
], MongoDataSourceManager.prototype, "app", void 0);
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", fastcar_core_1.Logger)
], MongoDataSourceManager.prototype, "sysLogger", void 0);
MongoDataSourceManager = __decorate([
    annotation_1.ApplicationStart(fastcar_core_1.BootPriority.Base, "start"),
    annotation_1.ApplicationStop(fastcar_core_1.BootPriority.Lowest, "stop"),
    __metadata("design:paramtypes", [])
], MongoDataSourceManager);
exports.default = MongoDataSourceManager;
