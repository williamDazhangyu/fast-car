import { MongoClientOptions } from "mongodb";

export type SqlConfig = {
	opts?: MongoClientOptions;
	source: string;
	url: string;
	default?: boolean;
};

export type MongoConfig = {
	dataSoucreConfig: SqlConfig[];
	slowSQLInterval: number; //单位毫秒默认500毫秒会输出
	maximumConnectionReleaseTime?: number; //连接可用最大时长，防止因为忘记释放而被占用 单位毫秒
	printSQL: boolean; //是否打印sql
	sessionTimeOut: number;
};

export const MongoDefaultConfig: MongoConfig = {
	dataSoucreConfig: [],
	slowSQLInterval: 500,
	printSQL: false,
	sessionTimeOut: 5000,
};
