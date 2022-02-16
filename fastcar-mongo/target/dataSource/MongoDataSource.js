"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
class MongoDataSource {
    //这边做一个约定 连接时必须保证连上了一个可用的数据库
    async createClient({ url, opts = {} }) {
        this._pool = await mongodb_1.MongoClient.connect(url, opts);
    }
    //关于连接的操作
    getConnection() {
        return this._pool.db();
    }
    //关闭连接池
    async close() {
        await this._pool.close();
    }
    getPool() {
        return this._pool;
    }
}
exports.default = MongoDataSource;
