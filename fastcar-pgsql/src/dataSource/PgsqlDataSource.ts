import * as pg from "pg";

const KEY_WORDS = ["null", "NULL", null, undefined, "DEFAULT"];

class PgsqlDataSource {
	_pool: pg.Pool;

	constructor(sqlConfig: pg.PoolOptions) {
		this._pool = new pg.Pool(sqlConfig);
		this.check();
	}

	async check(): Promise<void> {
		//获取一个连接进行验证
		let conn = await this.getConnection();
		this.releaseConnection(conn);
	}

	static format(sql: string, values: any[] = []): string {
		let counter = -1;
		return sql.replace(/\?/g, () => {
			counter++;
			let val = values[counter];
			if (KEY_WORDS.includes(val)) {
				return val;
			}

			return `'${values[counter]}'`;
		});
	}

	static replacePlaceholders(
		sql: string,
		args: any[]
	): {
		sql: string;
		args: any[];
	} {
		if (args.length == 0) {
			return {
				sql,
				args,
			};
		}

		let index = 0;
		let counter = 1;
		let newargs: any[] = [];

		let newSql = sql.replace(/\?/g, () => {
			let val = args[index];
			++index;

			if (KEY_WORDS.includes(val)) {
				return val;
			} else {
				newargs.push(val);
				return `$${counter++}`;
			}
		});

		return {
			sql: newSql,
			args: newargs,
		};
	}

	//关于连接的操作
	async getConnection(): Promise<pg.PoolClient> {
		return await this._pool.connect();
	}

	//获取事务的连接
	async getBeginConnection(): Promise<pg.PoolClient> {
		let conn = await this.getConnection();
		await this.beginTransaction(conn);
		return conn;
	}

	releaseConnection(conn: pg.PoolClient): void {
		conn.release();
	}

	//关于事务的操作
	async beginTransaction(conn: pg.PoolClient): Promise<void> {
		await conn.query("BEGIN");
	}

	async commit(conn: pg.PoolClient): Promise<void> {
		await conn.query("commit");
	}

	async rollback(conn: pg.PoolClient): Promise<void> {
		await conn.query("ROLLBACK");
	}

	//关闭连接池
	async close(): Promise<void> {
		await this._pool.end();
	}

	getPool(): pg.Pool {
		return this._pool;
	}
}

export default PgsqlDataSource;
