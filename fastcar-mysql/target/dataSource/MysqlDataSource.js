"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql2/promise");
class MysqlDataSource {
    constructor(sqlConfig) {
        this._pool = mysql.createPool(sqlConfig);
        this.check();
    }
    async check() {
        //获取一个连接进行验证
        let conn = await this.getConnection();
        this.releaseConnection(conn);
    }
    format(sql, values = []) {
        //防止sql注入
        return mysql.format(sql, JSON.parse(JSON.stringify(values)));
    }
    //关于连接的操作
    async getConnection() {
        return await this._pool.getConnection();
    }
    //获取事务的连接
    async getBeginConnection() {
        let conn = await this._pool.getConnection();
        await this.beginTransaction(conn);
        return conn;
    }
    releaseConnection(conn) {
        conn.release();
    }
    //关于事务的操作
    async beginTransaction(conn) {
        await conn.beginTransaction();
    }
    async commit(conn) {
        await conn.commit();
    }
    async rollback(conn) {
        await conn.rollback();
    }
    //关闭连接池
    async close() {
        await this._pool.end();
    }
    getPool() {
        return this._pool;
    }
}
exports.default = MysqlDataSource;
