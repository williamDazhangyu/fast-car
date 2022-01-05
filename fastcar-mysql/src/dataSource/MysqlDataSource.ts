import * as mysql from "mysql2/promise";

class MysqlDataSource {
	_pool: mysql.Pool;

	constructor(sqlConfig: mysql.PoolOptions) {
		this._pool = mysql.createPool(sqlConfig);
		this.check();
	}

	async check(): Promise<void> {
		//获取一个连接进行验证
		let conn = await this.getConnection();
		this.releaseConnection(conn);
	}

	format(sql: string, values: any[] = []): string {
		//防止sql注入
		return mysql.format(sql, JSON.parse(JSON.stringify(values)));
	}

	//关于连接的操作
	async getConnection(): Promise<mysql.PoolConnection> {
		return await this._pool.getConnection();
	}

	//获取事务的连接
	async getBeginConnection(): Promise<mysql.PoolConnection> {
		let conn = await this._pool.getConnection();
		await this.beginTransaction(conn);
		return conn;
	}

	releaseConnection(conn: mysql.PoolConnection): void {
		conn.release();
	}

	//关于事务的操作
	async beginTransaction(conn: mysql.PoolConnection): Promise<void> {
		await conn.beginTransaction();
	}

	async commit(conn: mysql.PoolConnection): Promise<void> {
		await conn.commit();
	}

	async rollback(conn: mysql.PoolConnection): Promise<void> {
		await conn.rollback();
	}

	//关闭连接池
	async close(): Promise<void> {
		await this._pool.end();
	}

	getPool(): mysql.Pool {
		return this._pool;
	}
}

export default MysqlDataSource;
