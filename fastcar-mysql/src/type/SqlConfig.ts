import * as mysql from "mysql2";

export type SqlConfig = mysql.PoolOptions & {
	source: string;
	readDefault?: boolean; //是否读默认
	writeDefault?: boolean; //是否写默认
	default?: boolean; //找不到数据源或者不指定数据源时进行选用
};

export type MySqlConfig = {
	dataSoucreConfig: SqlConfig[];
	slowSQLInterval?: number; //单位毫秒默认500毫秒会输出
	maximumConnectionReleaseTime?: number; //连接可用最大时长，防止因为忘记释放而被占用 单位毫秒
};

export const MySqlConfigDefault = {
	slowSQLInterval: 500,
	maximumConnectionReleaseTime: 10000, //默认十秒
};
