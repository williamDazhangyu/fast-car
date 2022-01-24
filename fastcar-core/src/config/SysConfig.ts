import { ApplicationConfig } from "./ApplicationConfig";
import { Log4jsConfig } from "./Log4jsConfig";

/***
 * @version 1.0 系统基础配置
 */
export type SYSConfig = {
	application: ApplicationConfig; //应用配置
	settings: Map<string, any>; //自定义设置项
};

export const SYSDefaultConfig: SYSConfig = {
	application: {
		name: "app",
		env: "development",
		version: "1.0.0",
		hotter: false,
	},
	settings: new Map<string, Object>(), //自定义配置
};

export const LogDefaultConfig: Log4jsConfig = {
	appenders: {
		sysLogger: {
			type: "console",
		},
	},
	categories: { default: { appenders: ["sysLogger"], level: "ALL" } },
};
