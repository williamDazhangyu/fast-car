import { MongoClient, Db, MongoClientOptions } from "mongodb";
import { BaseMapper, DataSourceManager, OrderType, RowData, SqlQuery, SqlUpdate, SqlWhere } from "@fastcar/core/db";
import { OperationSet, SqlExecType } from "./src/type/SqlExecType";

export type SqlConfig = {
	opts?: MongoClientOptions;
	source: string;
	url: string;
	default?: boolean;
};

//默认配置
export type MongoConfig = {
	dataSoucreConfig: SqlConfig[];
	slowSQLInterval: number; //单位毫秒默认500毫秒会输出
	maximumConnectionReleaseTime?: number; //连接可用最大时长，防止因为忘记释放而被占用 单位毫秒
	printSQL: boolean; //是否打印sql 默认fasle
	sessionTimeOut: number;
};

export class MongoDataSource {
	_pool: MongoClient;

	//这边做一个约定 连接时必须保证连上了一个可用的数据库
	createClient({ url, opts }: SqlConfig): Promise<void>;

	//关于连接的操作
	getConnection(): Db;

	//关闭连接池
	close(): Promise<void>;

	getPool(): MongoClient;
}

export class MongoDataSourceManager implements DataSourceManager {
	start(): Promise<void>;

	stop(): Promise<void>;

	connExecute(conn: Db, params: OperationSet[]): Promise<any>;

	createDataSource(): Promise<void>;

	getDataSoucreByName(name: string): MongoDataSource | undefined;

	getDefaultSoucre(): string;

	//执行sql
	execute(args: SqlExecType): Promise<any>;

	createSession(): string;

	destorySession(sessionId: string, status: boolean): Promise<void>;
}

export class MongoMapper<T extends Object> extends BaseMapper<T> {
	protected dsm: MongoDataSourceManager;

	protected primaryKey: string;

	protected covertEntity(row: T): RowData;

	//获取数据库别名通过代码内的名称
	protected getFieldName(name: string): string;

	//转换操作符名称
	protected covertOperation(key: string): string;

	//转换字段名称
	protected analysisFields(fields?: string[]): RowData | null;

	protected analysisCondition(where?: SqlWhere, joinKey?: string): RowData;

	protected analysisWhere(where?: SqlWhere, joinKey?: string): RowData;

	protected analysisGroups(groups?: string[]): RowData | null;

	protected analysisOrders(orders?: OrderType): RowData | null;

	protected analysisLimit(limit?: number, offest?: number): RowData | null;

	protected analysisRow(row: RowData): RowData | null;

	exec(opts: OperationSet[], ds?: string): Promise<any>;

	saveORUpdate(rows: T | T[], ds?: string): Promise<number>;

	saveOne(row: T, ds?: string): Promise<string>;

	saveList(rows: T[], ds?: string): Promise<boolean>;

	update({ row, where }: SqlUpdate, ds?: string): Promise<boolean>;

	updateOne({ row, where }: SqlUpdate, ds?: string): Promise<boolean>;

	updateByPrimaryKey(row: T, ds?: string): Promise<boolean>;

	select(conditions: SqlQuery, ds?: string): Promise<T[]>;

	selectByCustom<T>(conditions: SqlQuery, ds?: string): Promise<T[]>;

	selectOne(conditions?: SqlQuery, ds?: string): Promise<T | null>;

	selectByPrimaryKey(row: T, ds?: string): Promise<T | null>;

	exist(where: SqlWhere, ds?: string): Promise<boolean>;

	count(where: SqlWhere, ds?: string): Promise<number>;

	delete(where: SqlWhere, ds?: string): Promise<boolean>;

	deleteOne(where: SqlWhere, ds?: string): Promise<boolean>;

	deleteByPrimaryKey(row: T, ds?: string): Promise<boolean>;
}
