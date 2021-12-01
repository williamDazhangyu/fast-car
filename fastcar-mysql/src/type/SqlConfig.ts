export type SqlConfig = {
	source: string;
	host: string;
	port?: number;
	database: string;
	user: string;
	password: string;
	maxConnection: number;
	queueLimit?: number; //最大等待队列数
};
