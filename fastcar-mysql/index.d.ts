import { FastCarApplication, Logger } from "fastcar-core";
import * as mysql from "mysql2";
import { OrderType, RowData, RowType, SqlDelete, SqlQuery, SqlUpdate, SqlWhere } from "./src/operation/OperationType";

declare type SqlConfig = mysql.PoolOptions & {
	source: string;
	readDefault?: boolean; //是否读默认
	writeDefault?: boolean; //是否写默认
	default?: boolean; //找不到数据源或者不指定数据源时进行选用
};

declare type MySqlConfig = {
	dataSoucreConfig: SqlConfig[];
	slowSQLInterval?: number; //单位毫秒默认500毫秒会输出
	maximumConnectionReleaseTime?: number; //连接可用最大时长，防止因为忘记释放而被占用 单位毫秒
	printSQL?: boolean; //是否打印sql
	sessionTimeOut: number;
};

export enum DataTypeEnum {
	tinyint = "boolean", //这边做一个约定为tinyint的时候为boolean类型
	smallint = "number",
	mediumint = "number",
	int = "number",
	integer = "number",
	bigint = "number",
	float = "number",
	double = "number",
	decimal = "number",

	date = "Date",
	time = "string",
	year = "string",
	datetime = "Date",
	timestamp = "Date",

	char = "string",
	varchar = "string",
	tinyblob = "string",
	tinytext = "string",
	blob = "string",
	text = "string",
	mediumblob = "string",
	mediumtext = "string",
	longblob = "string",
	longtext = "string",
}

export enum DesignMeta {
	paramTypes = "design:paramtypes", //传参类型
	returnType = "design:returntype", //返回类型
	designType = "design:type", //设计类型
	table = "db:table", //表名
	field = "db:field", //列名
	fieldMap = "db:fieldMap", //注入列名集合
	dbType = "db:dbType", //数据类型
	primaryKey = "db:primaryKey", //主键类型
	maxLength = "db:maxLength", //最大长度
	notNull = "db:notNull", //不为空
	entity = "db:entity", //实例化的数据库类
	mapping = "db:mapping", //映射描述
	dbFields = "db:fields", //数据库名-ts名
	sqlSession = "SqlSession", //sql会话
}

declare type MapperType = {
	name: string; //变量名称
	type: string; //类型
	field: string; //数据库列名
	dbType: string; //数据类型
	maxLength?: number; //最大长度 当为字符串或者整型时传递
	notNull?: boolean; //是否为空 默认为空
	primaryKey?: boolean; //是否为主键 默认为false
	serialize?: Function; //序列化对象方法
};

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

export class MysqlDataSourceManager {
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

	//执行多个sql语句 默认开启事务
	batchExecute(tasks: SqlExecType[]): Promise<boolean>;

	//获取一个可用的连接
	getConnection(name: string): Promise<mysql.PoolConnection | null>;

	getDefaultSoucre(read?: boolean): string;

	checkSession(): void;
}

export class MysqlMapper<T extends Object> {
	protected tableName: string;
	protected classZ: any; //映射的原型类
	protected mappingMap: Map<string, MapperType>; //代码别名-映射关系
	protected mappingList: MapperType[];
	protected dbFields: Map<string, string>; //数据库别名-代码别名
	protected dsm: MysqlDataSourceManager;

	//获取数据库别名通过代码内的名称
	protected getFieldName(name: string): string;

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

	protected setRow(rowData: Object): T;

	protected setRows(rowDataList: Object[]): T[];

	//获取默认数据源 这边可以自行拓展
	getDataSource(service?: string, read?: boolean): string;

	/***
	 * @version 1.0 更新或者添加记录多条记录(一般用于整条记录的更新)
	 */
	saveORUpdate(rows: T | T[], sessionId?: string, ds?: string): Promise<number>;

	/***
	 * @version 1.0 插入单条记录返回主键
	 */
	saveOne(row: T, sessionId?: string, ds?: string): Promise<number>;

	/***
	 * @version 1.0 批量插入记录
	 */
	saveList(rows: T[], sessionId?: string, ds?: string): Promise<boolean>;

	/***
	 * @version 1.0 更新记录
	 *
	 */
	update({ row, where, limit }: SqlUpdate, sessionId?: string, ds?: string): Promise<boolean>;

	/****
	 * @version 1.0 更新一条数据
	 *
	 */
	updateOne(sqlUpdate: SqlUpdate, sessionId?: string, ds?: string): Promise<boolean>;

	/***
	 * @version 1.0 根据实体类的主键来更新数据
	 *
	 */
	updateByPrimaryKey(row: T, sessionId?: string, ds?: string): Promise<boolean>;

	/***
	 * @version 1.0 根据条件进行查找
	 */
	select(conditions: SqlQuery, sessionId?: string, ds?: string): Promise<T[]>;

	/***
	 * @version 1.0 查询单个对象
	 *
	 */
	selectOne(conditions?: SqlQuery, sessionId?: string, ds?: string): Promise<T | null>;

	/***
	 * @version 1.0 通过主键查找对象
	 *
	 */
	selectByPrimaryKey(row: T, sessionId?: string, ds?: string): Promise<T | null>;

	/***
	 * @version 1.0 判定是否存在
	 *
	 */
	exist(where: SqlWhere, sessionId?: string, ds?: string): Promise<boolean>;

	/***
	 * @version 1.0 统计符合条件的记录
	 */
	count(where: SqlWhere, sessionId?: string, ds?: string): Promise<number>;

	/***
	 * @version 1.0 按照条件删除记录
	 */
	delete(conditions: SqlDelete, sessionId?: string, ds?: string): Promise<boolean>;

	/***
	 * @version 1.0 删除某条记录
	 */
	deleteOne(where: SqlWhere, sessionId?: string, ds?: string): Promise<boolean>;

	/***
	 * @version 1.0 自定义sql执行
	 */
	execute(sql: string, args?: any[], sessionId?: string, ds?: string): Promise<any>;
}