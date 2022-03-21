import { MySqlConfig, MySqlConfigDefault } from "../type/SqlConfig";
import { SqlExecType } from "../type/SqlExecType";
import MysqlDataSource from "./MysqlDataSource";
import { ApplicationStart, ApplicationStop, Autowired, Log } from "fastcar-core/annotation";
import { BootPriority, FastCarApplication, Logger } from "fastcar-core";
import * as mysql from "mysql2/promise";
import * as uuid from "uuid";
import { EnableScheduling, ScheduledInterval, TimeUnit } from "fastcar-timer";
import { BeanName } from "fastcar-core/annotation";
import { DataSourceManager, SqlError } from "fastcar-core/db";

const SELECT = "SELECT";
const select = "select";

@ApplicationStart(BootPriority.Base, "start")
@ApplicationStop(BootPriority.Lowest, "stop")
@EnableScheduling
@BeanName("MysqlDataSourceManager")
class MysqlDataSourceManager implements DataSourceManager {
	@Autowired
	protected app!: FastCarApplication;

	@Log("sql")
	protected sysLogger!: Logger;

	protected sourceMap: Map<string, MysqlDataSource>;
	protected config!: MySqlConfig;
	protected defaultSource!: string; //默认数据源
	protected writeDefaultSource!: string; //默认写数据源
	protected readDefaultSource!: string; //默认读数据源
	protected sessionList: Map<string, number>; //session会话管理 如果超时或者释放时间过长则进行释放

	constructor() {
		//进行数据库初始化
		this.sourceMap = new Map();
		this.sessionList = new Map();
	}

	async connExecute(conn: mysql.PoolConnection, sql: string, args: any[] = []) {
		//打印sql
		let finalSQL = mysql.format(sql, args);

		if (this.config.printSQL) {
			this.sysLogger.info(finalSQL);
		}

		//检查sql执行时间
		let beforeTime = Date.now();
		let res = await conn.execute(sql, args);
		let afterTime = Date.now();
		let diff = afterTime - beforeTime;

		if (diff >= this.config.slowSQLInterval) {
			this.sysLogger.warn(`The SQL execution time took ${diff} ms, more than ${this.config.slowSQLInterval} ms`);
			this.sysLogger.warn(finalSQL);
		}

		return res;
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
		this.sourceMap.forEach(db => {
			db.close();
		});
		this.sourceMap.clear();
	}

	createDataSource(): void {
		if (this.config.dataSoucreConfig.length == 0) {
			return;
		}

		this.config.dataSoucreConfig.forEach(item => {
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

	//创建session会话 用于事务的管理
	createSession(): string {
		let sessionId = "SQL:" + uuid.v4().replace(/-/g, "");
		let connMap = new Map<string, mysql.PoolConnection[]>();
		Reflect.set(this, sessionId, connMap);
		this.sessionList.set(sessionId, Date.now());
		return sessionId;
	}

	getSession(sessionId: string): Map<string, mysql.PoolConnection[]> {
		let connMap = Reflect.get(this, sessionId);
		return connMap;
	}

	isReadBySql(sql: string): boolean {
		let formatSQL = sql.trim();
		return formatSQL.startsWith(SELECT) || formatSQL.startsWith(select);
	}

	async destorySession(sessionId: string, status: boolean): Promise<void> {
		let connMap = this.getSession(sessionId);
		if (connMap) {
			for (let [ds, conns] of connMap) {
				let db = this.getDataSoucreByName(ds);
				conns.forEach(async conn => {
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

	getDefaultSoucre(read: boolean = true): string {
		let defaultName = read ? this.readDefaultSource : this.writeDefaultSource;
		if (!defaultName) {
			defaultName = this.defaultSource;
		}

		return defaultName;
	}

	//执行会话语句
	async exec({ sql, args = [], ds, sessionId }: SqlExecType): Promise<any[]> {
		if (!ds) {
			ds = this.getDefaultSoucre(this.isReadBySql(sql));
		}
		if (sessionId) {
			let connMap: Map<string, mysql.PoolConnection[]> = Reflect.get(this, sessionId);
			if (connMap) {
				let conns = connMap.get(ds) || [];
				if (conns.length == 0) {
					connMap.set(ds, conns);
					let db = this.sourceMap.get(ds);
					if (!db) {
						throw new SqlError(`this datasoucre ${ds} cannot be found `);
					}
					let conn = await db.getBeginConnection();
					conns.push(conn);
				}
				if (conns.length > 0) {
					let result = await this.connExecute(conns[0], sql, args);
					return result;
				}
			}
			throw new SqlError(`session ${sessionId} cannot be found `);
		}

		return await this.execute({ sql, args, ds });
	}

	//执行sql
	async execute({ sql, args = [], ds }: SqlExecType): Promise<any[]> {
		return new Promise(async (resolve, reject) => {
			if (!ds) {
				ds = this.getDefaultSoucre(this.isReadBySql(sql));
			}
			let dataSoucre = this.sourceMap.get(ds);
			if (!dataSoucre) {
				return reject(new SqlError(`this datasoucre ${ds} cannot be found `));
			}

			let conn;
			try {
				let conn = await dataSoucre.getConnection();
				let result = await this.connExecute(conn, sql, args);
				dataSoucre.releaseConnection(conn);
				return resolve(result);
			} catch (e) {
				if (conn) {
					dataSoucre.releaseConnection(conn);
				}

				this.sysLogger.error("sql error:", mysql.format(sql, args));

				if (e instanceof Error) {
					this.sysLogger.error("reason:", e.message);
					this.sysLogger.error("stack:", e.stack);
				}

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
				let ds = task.ds || this.getDefaultSoucre(this.isReadBySql(task.sql));
				let conn = connMap.get(ds);

				if (!conn) {
					let db = this.sourceMap.get(ds);
					if (!db) {
						throw new SqlError(`this datasoucre ${ds} cannot be found `);
					}
					conn = await db.getBeginConnection();
					connMap.set(ds, conn);
				}

				await this.connExecute(conn, task.sql, task.args);
			}
		} catch (e) {
			this.sysLogger.error(e);
			errFlag = true;
		} finally {
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
	async getConnection(name: string): Promise<mysql.PoolConnection | null> {
		let db = this.sourceMap.get(name);
		if (!db) {
			return null;
		}
		let conn = await db.getConnection();
		return conn;
	}

	@ScheduledInterval({ fixedRate: 1, fixedRateString: TimeUnit.second })
	checkSession(): void {
		if (this.sessionList.size > 0) {
			let cleanSessions: string[] = Array.of();
			let sessionTimeOut = this.config.sessionTimeOut;
			let nowTime = Date.now();

			for (let [id, time] of this.sessionList) {
				let diff = nowTime - time;
				if (diff >= sessionTimeOut) {
					cleanSessions.push(id);
				}
			}

			if (cleanSessions.length > 0) {
				cleanSessions.forEach(async sessionId => {
					this.sysLogger.error(`${sessionId}: The session was longer than ${sessionTimeOut} milliseconds`);
					this.destorySession(sessionId, true);
				});
			}
		}
	}
}

export default MysqlDataSourceManager;
