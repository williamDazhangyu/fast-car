import { MySqlConfig, MySqlConfigDefault } from "../type/SqlConfig";
import { SqlExecType } from "../type/SqlExecType";
import MysqlDataSource from "./MysqlDataSource";
import { ApplicationStart, ApplicationStop, Autowired } from "fastcar-core/annotation";
import { BootPriority, FastCarApplication, Logger } from "fastcar-core";
import * as mysql from "mysql2/promise";

@ApplicationStart(BootPriority.Base, "start")
@ApplicationStop(BootPriority.Lowest, "stop")
class MysqlDataSourceManager {
	@Autowired
	private app!: FastCarApplication;

	@Autowired
	private sysLogger!: Logger;

	private sourceMap: Map<string, MysqlDataSource>;
	private config!: MySqlConfig;
	private defaultSource!: string; //默认数据源
	private writeDefaultSource!: string; //默认写数据源
	private readDefaultSource!: string; //默认读数据源

	constructor() {
		//进行数据库初始化
		this.sourceMap = new Map();
	}

	start(): void {
		let config: MySqlConfig = this.app.getSetting("mysql");
		if (config) {
			this.config = Object.assign({}, MySqlConfigDefault, config);
			this.createDataSource();
		}
	}

	stop(): void {
		//结束销毁
		this.sourceMap.forEach((db) => {
			db.close();
		});
		this.sourceMap.clear();
	}

	createDataSource(): void {
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
			let ds = new MysqlDataSource(tmpConfig);
			this.sourceMap.set(source, ds);
		});

		if (!this.defaultSource) {
			this.defaultSource = this.config.dataSoucreConfig[0].source;
		}
	}

	getDataSoucreByName(name: string): MysqlDataSource | undefined {
		return this.sourceMap.get(name);
	}

	//执行sql
	async execute({ sql, args = [], ds = this.defaultSource }: SqlExecType): Promise<any[]> {
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
			} catch (e: any) {
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
	async batchExecute(tasks: SqlExecType[]): Promise<boolean> {
		let connMap = new Map<string, mysql.PoolConnection>();
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
		} catch (e) {
			this.sysLogger.error(e);
			errFlag = true;
		} finally {
			for (let [ds, conn] of connMap) {
				let db = this.sourceMap.get(ds);
				errFlag ? db?.rollback(conn) : db?.commit(conn);
				db?.releaseConnection(conn);
			}
			connMap.clear();
			return !errFlag;
		}
	}

	//获取一个可用的连接
	async getConnection(name: string): Promise<mysql.PoolConnection | null> {
		let db = this.sourceMap.get(name);
		if (!db) {
			return null;
		}
		let conn = await db.getConnection();
		return conn;
	}

	getDefaultSoucre(read: boolean = true): string {
		let defaultName = read ? this.readDefaultSource : this.writeDefaultSource;
		if (!defaultName) {
			defaultName = this.defaultSource;
		}

		return defaultName;
	}
}

export default MysqlDataSourceManager;
