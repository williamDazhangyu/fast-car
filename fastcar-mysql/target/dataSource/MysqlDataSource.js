"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
class MysqlDataSource {
    constructor(sqlConfig) {
        this.format = function (sql, values = []) {
            //防止sql注入
            return mysql.format(sql, values);
        };
        this.sqlConfig = sqlConfig;
        this.createMysqlPool();
    }
    createMysqlPool() {
        let sqlConfig = this.sqlConfig;
        let config = Object.assign(sqlConfig, {
            connectionLimit: sqlConfig.maxConnection || 10,
            queueLimit: sqlConfig.queueLimit || 1000,
        });
        this._pool = mysql.createPool(config);
    }
    async getConnection() {
        return new Promise((resolve, reject) => {
            this._pool.getConnection((err, connection) => {
                if (err) {
                    console.error("GET CONNECTION ERROR", err.message);
                    reject(new Error("GET CONNECTION ERROR"));
                    return;
                }
                resolve(connection);
            });
        });
    }
    async query(sql, args = []) {
        return new Promise(async (resolve) => {
            const connection = await this.getConnection();
            if (!connection) {
                console.error("SQL LOST CONNECTION");
                resolve({
                    error: true,
                    errMsg: "SQL LOST CONNECTION",
                });
                return;
            }
            //防止sql 注入
            let finalSQL = this.format(sql, args);
            // console.info('sql---', finalSQL);
            connection.query(finalSQL, [], function (err, res) {
                //立马释放连接
                connection.release();
                //语法错误
                if (!!err) {
                    console.error("SQLMSG", finalSQL);
                    console.error("SQLERROR", err.stack || err.message);
                    resolve({
                        error: true,
                        errMsg: err.stack || err.message,
                    });
                    return;
                }
                resolve({
                    error: false,
                    data: res,
                });
            });
        });
    }
    //关于事务的操作
    async beginTransaction() { }
    //关闭连接池
    async close() {
        return new Promise(resolve => {
            this._pool.end(err => {
                if (!!err) {
                    resolve("fail");
                }
                else {
                    resolve("OK");
                }
            });
        });
    }
}
exports.default = MysqlDataSource;
