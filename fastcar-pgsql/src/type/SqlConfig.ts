import * as pg from "pg";

export type SqlConfig = pg.PoolOptions & {
	source: string;
	readDefault?: boolean; //是否读默认
	writeDefault?: boolean; //是否写默认
	default?: boolean; //找不到数据源或者不指定数据源时进行选用
};

export type PgSqlConfig = {
	dataSoucreConfig: SqlConfig[];
	slowSQLInterval: number; //单位毫秒默认500毫秒会输出
	maximumConnectionReleaseTime?: number; //连接可用最大时长，防止因为忘记释放而被占用 单位毫秒
	printSQL: boolean; //是否打印sql
	sessionTimeOut: number;
};

export const PgSqlConfigDefault = {
	slowSQLInterval: 500,
	maximumConnectionReleaseTime: 10000, //默认十秒
	printSQL: false,
	sessionTimeOut: 5000, //如果开启事务后5秒内仍不释放则主动释放
};
