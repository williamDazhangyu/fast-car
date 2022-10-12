export enum OperatorEnum {
	eq = "=",
	neq = "!=",
	gt = ">",
	gte = ">=",
	lt = "<",
	lte = "<=",
	like = "LIKE",
	in = "IN",
	isNUll = "ISNULL",
	isNotNull = "IS NOT NULL",
	inc = "+", //累加
	dec = "-", //累减
	multiply = "*", //累乘
	division = "/", //累除
}

export enum JoinEnum {
	and = "AND",
	or = "OR",
}

export enum OrderEnum {
	asc = "ASC",
	desc = "DESC",
}

export type SqlValue = number | string | number[] | string[] | boolean | boolean[] | null | Date;

//where表达式
type SqlExpression =
	| {
			[key: string]: { [key: string]: SqlValue };
	  }
	| SqlValue;

export type SqlWhere = { [key: string]: SqlExpression | SqlWhere };

export type RowData = {
	[key: string]: SqlValue | { operate: string; value: SqlValue };
};

export type OrderType = { [key: string]: OrderEnum };

export type SqlDelete = {
	where?: SqlWhere; //查询条件
	limit?: number; //限制行数
};

export type SqlQuery = {
	where?: SqlWhere; //查询条件
	fields?: string[]; //查询出来的元素
	groups?: string[]; //分组排序
	orders?: OrderType; //排序
	limit?: number; //限制行数
	offest?: number; //偏移量
};

export type SqlUpdate = {
	where?: SqlWhere; //查询条件
	row: RowData;
	limit?: number; //限制行数
};

export type RowType = {
	sql: string;
	args: any[];
};

export interface DBMapper<T> {
	/***
	 * @version 1.0 更新或者添加记录多条记录(一般用于整条记录的更新)
	 */
	saveORUpdate(rows: T | T[], ds?: string, sessionId?: string): Promise<number | string>;

	/***
	 * @version 1.0 插入单条记录返回主键
	 */
	saveOne(row: T, ds?: string, sessionId?: string): Promise<number | string>;

	/***
	 * @version 1.0 批量插入记录
	 */
	saveList(rows: T[], ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 更新记录
	 *
	 */
	update({ row, where, limit }: SqlUpdate, ds?: string, sessionId?: string): Promise<boolean>;

	/****
	 * @version 1.0 更新一条数据
	 *
	 */
	updateOne(sqlUpdate: SqlUpdate, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 根据实体类的主键来更新数据
	 *
	 */
	updateByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 根据条件进行查找
	 */
	select(conditions: SqlQuery, ds?: string, sessionId?: string): Promise<T[]>;

	/***
	 * @version 1.0 查询单个对象
	 *
	 */
	selectOne(conditions?: SqlQuery, ds?: string, sessionId?: string): Promise<T | null>;

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
	delete(conditions: SqlDelete, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 删除某条记录
	 */
	deleteOne(where: SqlWhere, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 删除某条记录根据主键
	 */
	deleteByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean>;
}

export class BaseMapper<T extends Object> implements DBMapper<T> {
	protected tableName: string;
	protected classZ: any; //映射的原型类
	protected mappingMap: Map<string, MapperType>; //代码别名-映射关系
	protected mappingList: MapperType[];
	protected dbFields: Map<string, string>; //数据库别名-代码别名

	protected getFieldName(name: string): string;

	//格式化数据库数据转化为程序设计内的
	protected setRow(rowData: Object): T;

	protected setRows(rowDataList: Object[]): T[];

	/***
	 * @version 1.0 更新或者添加记录多条记录(一般用于整条记录的更新)
	 */
	saveORUpdate(rows: T | T[], ds?: string, sessionId?: string): Promise<number | string>;

	/***
	 * @version 1.0 插入单条记录返回主键
	 */
	saveOne(row: T, ds?: string, sessionId?: string): Promise<number | string>;

	/***
	 * @version 1.0 批量插入记录
	 */
	saveList(rows: T[], ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 更新记录
	 *
	 */
	update({ row, where, limit }: SqlUpdate, ds?: string, sessionId?: string): Promise<boolean>;

	/****
	 * @version 1.0 更新一条数据
	 *
	 */
	updateOne(sqlUpdate: SqlUpdate, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 根据实体类的主键来更新数据
	 *
	 */
	updateByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 根据条件进行查找
	 */
	select(conditions: SqlQuery, ds?: string, sessionId?: string): Promise<T[]>;

	/***
	 * @version 1.0 查询单个对象
	 *
	 */
	selectOne(conditions?: SqlQuery, ds?: string, sessionId?: string): Promise<T | null>;

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
	delete(conditions: SqlDelete, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 删除某条记录
	 */
	deleteOne(where: SqlWhere, ds?: string, sessionId?: string): Promise<boolean>;

	/***
	 * @version 1.0 删除某条记录根据主键
	 */
	deleteByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean>;
}

export type MapperType = {
	name: string; //量变名称
	type: string; //类型
	field: string; //数据库列名
	dbType: string; //数据类型
	primaryKey?: boolean; //是否为主键 默认为false
	serialize?: Function; //序列化对象方法
};

export enum DesignMeta {
	table = "db:table", //表名
	field = "db:field", //列名
	fieldMap = "db:fieldMap", //注入列名集合
	dbType = "db:dbType", //数据类型
	primaryKey = "db:primaryKey", //主键类型
	entity = "db:entity", //实例化的数据库类
	mapping = "db:mapping", //映射描述
	dbFields = "db:fields", //数据库名-ts名
	sqlSession = "SqlSession", //sql会话
}

export interface DataSourceManager {
	createSession(): string;

	destorySession(sessionId: string, status: boolean): void;

	destorySession(sessionId: string, status: boolean): Promise<void>;

	start(): void;

	stop(): void;
}

export class SqlError extends Error {}
