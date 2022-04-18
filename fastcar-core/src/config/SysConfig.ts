import { WinstonLoggerType } from "../type/WinstonLoggerType";
import { ApplicationConfig } from "./ApplicationConfig";

/***
 * @version 1.0 系统基础配置
 */
export type SYSConfig = {
	application: ApplicationConfig; //应用配置
	settings: Map<string | symbol, any>; //自定义设置项
};

export const SYSDefaultConfig: SYSConfig = {
	application: {
		name: "app",
		env: "development",
		version: "1.0.0",
	},
	settings: new Map<string, Object>(), //自定义配置
};

export const LogDefaultConfig: WinstonLoggerType = {
	consoleLevel: "info",
	fileLevel: "info",
	rootPath: __dirname, //日志路径
	maxsize: 1024 * 1024 * 10, //默认10M
	maxFiles: 30,
	printConsole: true,
};
