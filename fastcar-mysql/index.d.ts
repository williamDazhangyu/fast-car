import { FastCarApplication, Logger } from "@fastcar/core";
import * as mysql from "mysql2";
import { DBMapper, MapperType, OrderType, RowData, RowType, SqlDelete, SqlQuery, SqlUpdate, SqlWhere } from "@fastcar/core/db";
import { MySqlConfig } from "./src/type/SqlConfig";
import { DataSourceManager } from "@fastcar/core/db";

export * from "./src/type/DataTypeEnum";

declare type SqlExecType = {
	sql: string;
	args?: any[];
	ds?: string;
	sessionId?: string;
};

export class MysqlDataSource {
	_pool: mysql.Pool;

	constructor(sqlConfig: mysql.PoolOptions);

	check(): Promise<void>;

	format(sql: string, values?: any[]): string;

	//关于连接的操作
	getConnection(): Promise<mysql.PoolConnection>;

	//获取事务的连接
	getBeginConnection(): Promise<mysql.PoolConnection>;

	releaseConnection(conn: mysql.PoolConnection): void;

	//关于事务的操作
	beginTransaction(conn: mysql.PoolConnection): Promise<void>;

	commit(conn: mysql.PoolConnection): Promise<void>;

	rollback(conn: mysql.PoolConnection): Promise<void>;

	//关闭连接池
	close(): Promise<void>;

	getPool(): mysql.Pool;
}

export class MysqlDataSourceManager implements DataSourceManager {
	protected app: FastCarApplication;
	protected sysLogger: Logger;
	protected sourceMap: Map<string, MysqlDataSource>;
	protected config: MySqlConfig;
	protected defaultSource: string; //默认数据源
	protected writeDefaultSource: string; //默认写数据源
	protected readDefaultSource: string; //默认读数据源
	protected sessionList: Map<string, number>; //session会话管理 如果超时或者释放时间过长则进行释放

	start(): void;

	stop(): void;

	createDataSource(): void;

	getDataSoucreByName(name: string): MysqlDataSource | undefined;

	//创建session会话 用于事务的管理
	createSession(): string;

	getSession(sessionId: string): Map<string, mysql.PoolConnection[]>;
	destorySession(sessionId: string, status: boolean): Promise<void>;

	//执行会话语句
	exec(sqlExec: SqlExecType): Promise<any[]>;

	//执行sql
	execute(sqlExec: SqlExecType): Promise<any[]>;

	query(sqlExec: SqlExecType): Promise<any[]>;

	//执行多个sql语句 默认开启事务
	batchExecute(tasks: SqlExecType[]): Promise<boolean>;

	//获取一个可用的连接
	getConnection(name: string): Promise<mysql.PoolConnection | null>;

	getDefaultSoucre(read?: boolean): string;

	checkSession(): void;
}

export class MysqlMapper<T extends Object> implements DBMapper<T> {
	protected tableName: string;
	protected classZ: any; //映射的原型类
	protected mappingMap: Map<string, MapperType>; //代码别名-映射关系
	protected mappingList: MapperType[];
	protected dbFields: Map<string, string>; //数据库别名-代码别名
	protected dsm: MysqlDataSourceManager;

	//获取数据库别名通过代码内的名称
	getFieldName(name: string): string;

	//自动映射数据库字段
	protected toDBValue(v: any, key: string, type: string): any;

	//分析选定字段
	protected analysisFields(fields?: string[]): string;

	//解析条件
	protected analysisWhere(where?: SqlWhere): RowType;

	protected analysisGroups(groups?: OrderType): string;

	protected analysisOrders(orders?: OrderType): string;

	protected analysisRow(row: RowData): RowType | null;

	protected analysisLimit(limit?: number, offest?: number): string;

	protected analysisForceIndex(fileds?: string[]): string;

	protected setRow(rowData: Object): T;

	protected setRows(rowDataList: Object[]): T[];

	//获取默认数据源 这边可以自行拓展
	getDataSource(service?: string, read?: boolean): string;

	/***
	 * @version 1.0 更新或者添加记录多条记录(一般用于整条记录的更新)
	 */
	saveORUpdate(rows: T | T[], ds?: string, sessionId?: string): Promise<number | string>;

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
	update({ row, where, limit, forceIndex }: SqlUpdate & { forceIndex?: string[] }, ds?: string, sessionId?: string): Promise<boolean>;

	/****
	 * @version 1.0 更新一条数据
	 *
	 */
	updateOne(sqlUpdate: SqlUpdate & { forceIndex?: string[] }, ds?: string, sessionId?: string): Promise<boolean>;

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
	delete(conditions: SqlDelete & { forceIndex?: string[] }, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 删除某条记录
	 */
	deleteOne(where: SqlWhere, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 删除某条记录根据主键
	 */
	deleteByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 自定义sql执行
	 */
	execute(sql: string, args?: any[], ds?: string, sessionId?: string): Promise<any>;

	/***
	 * @version 1.0 自定义sql执行 动态sql优先使用这个
	 */
	query(sql: string, args?: any[], ds?: string, sessionId?: string): Promise<any>;
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
