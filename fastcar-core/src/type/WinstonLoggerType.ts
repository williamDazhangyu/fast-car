export type WinstonLoggerType = {
	consoleLevel: string;
	fileLevel: string;
	rootPath: string; //日志路径
	maxsize: number; //字节
	maxFiles: number; //最大文件数
	printConsole: boolean; //是否在控制台模式
};

export const ColorLevelType = {
	info: [32, 39], //green

	debug: [36, 39], // cyan

	warn: [33, 39], //yellow

	error: [91, 39], //red
};
