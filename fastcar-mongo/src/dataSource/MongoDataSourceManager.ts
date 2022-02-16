import { Db } from "mongodb";
import MongoDataSource from "./MongoDataSource";
import { ApplicationStart, ApplicationStop, Autowired } from "fastcar-core/annotation";
import { BootPriority, FastCarApplication, Logger } from "fastcar-core";
import { MongoConfig, MongoDefaultConfig } from "../type/SqlConfig";
import { OperationSet, SqlExecType } from "../type/SqlExecType";
import { DataSourceManager } from "fastcar-core/db";
import SqlError from "../../../fastcar-mysql/src/type/SqlError";

@ApplicationStart(BootPriority.Base, "start")
@ApplicationStop(BootPriority.Lowest, "stop")
class MongoDataSourceManager implements DataSourceManager {
	@Autowired
	protected app!: FastCarApplication;

	@Autowired
	protected sysLogger!: Logger;

	protected sourceMap: Map<string, MongoDataSource>;
	protected config!: MongoConfig;
	protected defaultSource!: string; //默认数据源

	constructor() {
		//进行数据库初始化
		this.sourceMap = new Map();
	}

	async start(): Promise<void> {
		let config: MongoConfig = this.app.getSetting("mongo");
		if (config) {
			this.config = Object.assign({}, MongoDefaultConfig, config);
			await this.createDataSource();
		}
	}

	async stop(): Promise<void> {
		//结束销毁
		for (let [name, db] of this.sourceMap) {
			this.sysLogger.info(`close mongo client By ${name} `);
			await db.close();
		}
		this.sourceMap.clear();
	}

	async connExecute(conn: Db, params: OperationSet[]): Promise<any> {
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
		let result: any;
		let next: any = conn;

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

	async createDataSource(): Promise<void> {
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
			let ds = new MongoDataSource();
			await ds.createClient(tmpConfig);
			this.sourceMap.set(source, ds);
		}

		if (!this.defaultSource) {
			this.defaultSource = this.config.dataSoucreConfig[0].source;
		}
	}

	getDataSoucreByName(name: string): MongoDataSource | undefined {
		return this.sourceMap.get(name);
	}

	getDefaultSoucre(): string {
		return this.defaultSource;
	}

	//执行sql
	async execute(args: SqlExecType): Promise<any> {
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
			} catch (e) {
				this.sysLogger.error("sql error:", JSON.stringify(args.params));
				if (e instanceof Error) {
					this.sysLogger.error("reason:", e.message);
					this.sysLogger.error("stack:", e.stack);
				}

				return reject(e);
			}
		});
	}

	createSession(): string {
		throw new SqlError("createSession not implemented By mongo.");
	}

	destorySession(sessionId: string, status: boolean): void {
		throw new SqlError("destorySession not implemented By mongo.");
	}
}

export default MongoDataSourceManager;
