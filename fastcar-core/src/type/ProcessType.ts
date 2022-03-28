export type ProcessType = {
	pid: number; //进程id
	name: string; //进程名称
	env: string; //环境
	version: string; //版本
	rss: string; //常驻集大小
	heapTotal: string; //V8 的内存使用量
	heapUsed: string;
	arrayBuffers: string; //包含所有的Buffer
	external: string; //绑定到 V8 管理的 JavaScript 对象的 C++ 对象的内存使用量
	uptime: string; //运行时间
};
