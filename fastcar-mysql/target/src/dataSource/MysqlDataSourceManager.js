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
const SqlConfig_1 = require("../type/SqlConfig");
const MysqlDataSource_1 = require("./MysqlDataSource");
const annotation_1 = require("fastcar-core/annotation");
const fastcar_core_1 = require("fastcar-core");
const mysql = require("mysql2/promise");
const uuid = require("uuid");
const fastcar_timer_1 = require("fastcar-timer");
let MysqlDataSourceManager = class MysqlDataSourceManager {
    constructor() {
        //进行数据库初始化
        this.sourceMap = new Map();
        this.sessionList = new Map();
    }
    start() {
        let config = this.app.getSetting("mysql");
        if (config) {
            this.config = Object.assign({}, SqlConfig_1.MySqlConfigDefault, config);
            this.createDataSource();
        }
    }
    stop() {
        //结束销毁
        this.sourceMap.forEach((db) => {
            db.close();
        });
        this.sourceMap.clear();
    }
    createDataSource() {
        if (this.config.dataSoucreConfig.length == 0) {
            return;
        }
        this.config.dataSoucreConfig.forEach((item) => {
            let source = item.source;
            if (this.sourceMap.has(source)) {
                return;
            }
            if (item.default) {
                this.defaultSource = source;
            }
            if (item.readDefault) {
                this.readDefaultSource = source;
            }
            if (item.writeDefault) {
                this.writeDefaultSource = source;
            }
            let tmpConfig = Object.assign({}, item);
            Reflect.deleteProperty(tmpConfig, "source");
            let ds = new MysqlDataSource_1.default(tmpConfig);
            this.sourceMap.set(source, ds);
        });
        if (!this.defaultSource) {
            this.defaultSource = this.config.dataSoucreConfig[0].source;
        }
    }
    getDataSoucreByName(name) {
        return this.sourceMap.get(name);
    }
    //创建session会话 用于事务的管理
    createSession() {
        let sessionId = "SQL:" + uuid.v4().replace(/-/g, "");
        let connMap = new Map();
        Reflect.set(this, sessionId, connMap);
        this.sessionList.set(sessionId, Date.now());
        return sessionId;
    }
    getSession(sessionId) {
        let connMap = Reflect.get(this, sessionId);
        return connMap;
    }
    async destorySession(sessionId, status) {
        let connMap = this.getSession(sessionId);
        if (connMap) {
            for (let [ds, conns] of connMap) {
                let db = this.getDataSoucreByName(ds);
                conns.forEach(async (conn) => {
                    status ? await db?.rollback(conn) : await db?.commit(conn);
                    db?.releaseConnection(conn);
                });
            }
            connMap.clear();
        }
        Reflect.deleteProperty(this, sessionId);
        if (this.sessionList.has(sessionId)) {
            this.sessionList.delete(sessionId);
        }
    }
    //执行会话语句
    async exec({ sql, args = [], ds = this.defaultSource, sessionId }) {
        if (sessionId) {
            let connMap = Reflect.get(this, sessionId);
            if (connMap) {
                let conns = connMap.get(ds) || [];
                if (conns.length == 0) {
                    connMap.set(ds, conns);
                    let db = this.sourceMap.get(ds);
                    if (!db) {
                        throw new Error(`this datasoucre ${ds} cannot be found `);
                    }
                    let conn = await db.getBeginConnection();
                    conns.push(conn);
                }
                if (conns.length > 0) {
                    let result = await conns[0].execute(sql, args);
                    return result;
                }
            }
            throw new Error(`session ${sessionId} cannot be found `);
        }
        return await this.execute({ sql, args, ds });
    }
    //执行sql
    async execute({ sql, args = [], ds = this.defaultSource }) {
        if (this.config.printSQL) {
            this.sysLogger.info(mysql.format(sql, args));
        }
        return new Promise(async (resolve, reject) => {
            let dataSoucre = this.sourceMap.get(ds);
            if (!dataSoucre) {
                return reject(new Error(`this datasoucre ${ds} cannot be found `));
            }
            let conn;
            try {
                let conn = await dataSoucre.getConnection();
                let result = await conn.execute(sql, args);
                dataSoucre.releaseConnection(conn);
                return resolve(result);
            }
            catch (e) {
                if (conn) {
                    dataSoucre.releaseConnection(conn);
                }
                this.sysLogger.error("sql error:", mysql.format(sql, args));
                this.sysLogger.error("reason:", e.message);
                this.sysLogger.error("stack:", e.stack);
                return reject(e);
            }
        });
    }
    //执行多个sql语句 默认开启事务
    async batchExecute(tasks) {
        let connMap = new Map();
        let errFlag = false;
        try {
            for (let task of tasks) {
                let ds = task.ds || this.getDefaultSoucre();
                let conn = connMap.get(ds);
                if (!conn) {
                    let db = this.sourceMap.get(ds);
                    if (!db) {
                        throw new Error(`this datasoucre ${ds} cannot be found `);
                    }
                    conn = await db.getBeginConnection();
                    connMap.set(ds, conn);
                }
                await conn.execute(task.sql, task.args);
            }
        }
        catch (e) {
            this.sysLogger.error(e);
            errFlag = true;
        }
        finally {
            for (let [ds, conn] of connMap) {
                let db = this.sourceMap.get(ds);
                errFlag ? await db?.rollback(conn) : await db?.commit(conn);
                db?.releaseConnection(conn);
            }
            connMap.clear();
            return !errFlag;
        }
    }
    //获取一个可用的连接
    async getConnection(name) {
        let db = this.sourceMap.get(name);
        if (!db) {
            return null;
        }
        let conn = await db.getConnection();
        return conn;
    }
    getDefaultSoucre(read = true) {
        let defaultName = read ? this.readDefaultSource : this.writeDefaultSource;
        if (!defaultName) {
            defaultName = this.defaultSource;
        }
        return defaultName;
    }
    checkSession() {
        if (this.sessionList.size > 0) {
            let cleanSessions = Array.of();
            let sessionTimeOut = this.config.sessionTimeOut;
            let nowTime = Date.now();
            for (let [id, time] of this.sessionList) {
                let diff = nowTime - time;
                if (diff >= sessionTimeOut) {
                    cleanSessions.push(id);
                }
            }
            if (cleanSessions.length > 0) {
                cleanSessions.forEach(async (sessionId) => {
                    this.sysLogger.error(`${sessionId}: The session was longer than ${sessionTimeOut} milliseconds`);
                    this.destorySession(sessionId, true);
                });
            }
        }
    }
};
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", fastcar_core_1.FastCarApplication)
], MysqlDataSourceManager.prototype, "app", void 0);
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", fastcar_core_1.Logger)
], MysqlDataSourceManager.prototype, "sysLogger", void 0);
__decorate([
    fastcar_timer_1.ScheduledInterval({ fixedRate: 1, fixedRateString: fastcar_timer_1.TimeUnit.second }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MysqlDataSourceManager.prototype, "checkSession", null);
MysqlDataSourceManager = __decorate([
    annotation_1.ApplicationStart(fastcar_core_1.BootPriority.Base, "start"),
    annotation_1.ApplicationStop(fastcar_core_1.BootPriority.Lowest, "stop"),
    fastcar_timer_1.EnableScheduling,
    __metadata("design:paramtypes", [])
], MysqlDataSourceManager);
exports.default = MysqlDataSourceManager;
