import { FiledType } from "./src/type/FiledType";
import * as prettier from "prettier";
import * as pg from "pg";
import { BaseMapper, DataSourceManager, OrderType, RowData, RowType, SqlDelete, SqlQuery, SqlUpdate, SqlWhere } from "@fastcar/core/db";
import { PgSqlConfig } from "./src";
export * from "./src/type/DataTypeEnum";

declare type SqlExecType = {
	sql: string;
	args?: any[];
	ds?: string;
	sessionId?: string;
};

export class PgsqlDataSource {
	_pool: pg.Pool;

	constructor(sqlConfig: pg.PoolOptions);

	check(): Promise<void>;

	static format(sql: string, values?: any[]): string;

	static replacePlaceholders(
		sql: string,
		args: any[]
	): {
		sql: string;
		args: any[];
	};

	//关于连接的操作
	getConnection(): Promise<pg.PoolClient>;

	//获取事务的连接
	getBeginConnection(): Promise<pg.PoolClient>;

	releaseConnection(conn: pg.PoolClient): void;

	//关于事务的操作
	beginTransaction(conn: pg.PoolClient): Promise<void>;

	commit(conn: pg.PoolClient): Promise<void>;

	rollback(conn: pg.PoolClient): Promise<void>;

	//关闭连接池
	close(): Promise<void>;

	getPool(): pg.Pool;
}

export class PgsqlDataSourceManager implements DataSourceManager {
	protected sourceMap: Map<string, PgsqlDataSource>;
	protected config: PgSqlConfig;
	protected defaultSource: string; //默认数据源
	protected writeDefaultSource: string; //默认写数据源
	protected readDefaultSource: string; //默认读数据源
	protected sessionList: Map<string, number>; //session会话管理 如果超时或者释放时间过长则进行释放

	connExecute(conn: pg.PoolClient, sql: string, args?: any[]): Promise<pg.QueryResult<any>>;

	start(): void;

	stop(): void;

	createDataSource(): void;

	getDataSoucreByName(name: string): PgsqlDataSource | undefined;

	//创建session会话 用于事务的管理
	createSession(): string;

	getSession(sessionId: string): Map<string, pg.PoolClient[]>;

	isReadBySql(sql: string): boolean;

	destorySession(sessionId: string, status: boolean): Promise<void>;

	getDefaultSoucre(read?: boolean): string;

	//执行会话语句
	exec({ sql, args, ds, sessionId }: SqlExecType): Promise<pg.QueryResult<any>>;

	query({ sql, args, ds, sessionId }: SqlExecType): Promise<pg.QueryResult<any>>;

	//执行sql
	execute({ sql, args, ds }: SqlExecType): Promise<pg.QueryResult<any>>;

	//执行多个sql语句 默认开启事务
	batchExecute(tasks: SqlExecType[]): Promise<boolean>;

	//获取一个可用的连接
	getConnection(name: string): Promise<pg.PoolClient | null>;

	checkSession(): void;
}

export class PgsqlMapper<T extends Object> extends BaseMapper<T> {
	protected dsm: PgsqlDataSourceManager;

	//改变动态的tablename
	setTableName(table: string): void;

	//修正关键词的别名需转义的错误
	//修正多列转义时错误
	getFieldName(name: string): string;

	//自动映射数据库字段
	//兼容不小心传了数据的值
	protected toDBValue(v: any, key: string, type: string, value?: any): any;

	//分析选定字段
	protected analysisFields(fields?: string[]): string;

	//解析条件
	protected analysisWhere(where?: SqlWhere, joinKey?: string, params?: any[]): RowType;

	//解析条件
	protected analysisCondition(where?: SqlWhere, joinKey?: string, params?: any[]): RowType;

	protected analysisGroups(groups?: string[]): string;

	protected analysisOrders(orders?: OrderType): string;

	protected analysisRow(row?: RowData): RowType | null;

	protected analysisLimit({ limit, offest }: { limit?: number; offest?: number }): { str: string; args: Array<number | string> };

	protected analysisForceIndex(fileds?: string[]): string;

	protected analysisJoin(
		list?: Array<{
			type?: "INNER" | "LEFT" | "FULL" | "CROSS" | "RIGHT";
			table: string;
			on?: string;
		}>
	): string;

	//修正布尔值时的赋值错误
	protected setRow(rowData: Object): T;

	protected setRows(rowDataList: Object[]): T[];

	/***
	 * @version 1.0 更新或者添加记录多条记录(一般用于整条记录的更新)
	 */
	saveORUpdate(rows: T | T[], ds?: string, sessionId?: string): Promise<number>;

	/***
	 * @version 1.0 插入单条记录返回主键
	 */
	saveOne(row: T, ds?: string, sessionId?: string): Promise<number>;

	/***
	 * @version 1.0 批量插入记录
	 */
	saveList(rows: T[], ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 更新记录
	 *
	 */
	update({ row, where, limit, forceIndex, orders }: SqlUpdate & { forceIndex?: string[]; orders?: OrderType }, ds?: string, sessionId?: string): Promise<boolean>;

	/****
	 * @version 1.0 更新一条数据
	 *
	 */
	updateOne(sqlUpdate: SqlUpdate & { forceIndex?: string[]; orders?: OrderType }, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 根据实体类的主键来更新数据
	 *
	 */
	updateByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 根据条件进行查找
	 */
	select(conditions?: SqlQuery & { forceIndex?: string[] }, ds?: string, sessionId?: string): Promise<T[]>;
	/***
	 * @version 1.0 返回值自定义
	 */
	selectByCustom<T>(
		conditions?: SqlQuery & {
			forceIndex?: string[];
			join?: Array<{
				type?: "INNER" | "LEFT" | "FULL" | "CROSS" | "RIGHT";
				table: string;
				on?: string;
			}>;
			tableAlias?: string; //表名是别名
			camelcaseStyle?: boolean;
		},
		ds?: string,
		sessionId?: string
	): Promise<T[]>;

	/***
	 * @version 1.0 查询单个对象
	 *
	 */
	selectOne(conditions?: SqlQuery & { forceIndex?: string[] }, ds?: string, sessionId?: string): Promise<T | null>;

	/***
	 * @version 1.0 通过主键查找对象
	 *
	 */
	selectByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<T | null>;
	/***
	 * @version 1.0 判定是否存在
	 *
	 */
	exist(where: SqlWhere, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 统计符合条件的记录
	 */
	count(where: SqlWhere, ds?: string, sessionId?: string): Promise<number>;

	/***
	 * @version 1.0 按照条件删除记录
	 */
	delete(conditions: SqlDelete & { forceIndex?: string[]; orders?: OrderType }, ds?: string, sessionId?: string): Promise<boolean>;
	/***
	 * @version 1.0 删除某条记录
	 */
	deleteOne(where: SqlWhere, ds?: string, sessionId?: string): Promise<boolean>;

	deleteByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 自定义sql执行
	 */
	execute(sql: string, args?: any[], ds?: string, sessionId?: string): Promise<pg.QueryResult<any>>;

	/***
	 * @version 1.0 自定义sql执行 动态sql优先使用这个
	 */
	query(sql: string, args?: any[], ds?: string, sessionId?: string): Promise<pg.QueryResult<any>>;
}

/**
 * @version 1.0 where 条件辅助生成类
 */
export class WhereModel {
	private where: {};

	constructor(where?: { [key: string]: any }, info?: { field?: string[]; excludeField?: string[] });

	/**
	 * 过滤自身where内的空值
	 */
	filterNull(excludeField?: string[]): this;

	/**
	 *
	 * @param where 添加条件值
	 * @param info 添加信息值
	 */
	addFiled(where: { [key: string]: any }, info?: { field?: string[]; excludeField?: string[] }): this;

	/**
	 * 返回一个where对象
	 */
	toObject(): {};
}

export class ReverseGenerate {
	//根据数据库名称生成
	static formatType(dbtype: string): string;

	static formatClassName(name: string): string;

	//创建文件夹
	static createDir(dir: string): void;

	//生成model
	static genModel({ taleName, dir, fieldInfo, style, ignoreCamelcase }: { taleName: string; dir: string; fieldInfo: FiledType[]; style: prettier.Options; ignoreCamelcase: boolean }): void;

	//生成mapper层
	static genMapper({ taleName, mapperDir, rp, style }: { taleName: string; mapperDir: string; rp: string; style: prettier.Options }): Promise<void>;
	/***
	 * @version 1.0 根据数据库文件 逆向生成model
	 * @param config
	 * tables 表名
	 * modelDir model类生成的绝对路径文件夹
	 * mapperDir mapper类生成的绝对路径文件夹
	 * dbConfig 数据库配置
	 * style 基于prettier的格式
	 */
	static generator(config: {
		tables: string[];
		modelDir: string; //绝对路径
		mapperDir: string; //mapper绝对路径文件夹
		dbConfig: pg.PoolConfig;
		style?: prettier.Options;
		ignoreCamelcase?: boolean;
	}): Promise<void>;
}
