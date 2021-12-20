import { Log4jsConfig } from "../config/Log4jsConfig";
import { LogDefaultConfig } from "../config/SysConfig";
import * as log4js from "log4js";

//注入日志组件
export default function Log(config: Log4jsConfig = LogDefaultConfig) {
	return function(target: any) {
		let existConfig: Log4jsConfig = Reflect.get(target.prototype, "log4js");
		if (existConfig) {
			Object.assign(existConfig.appenders, config.appenders);
			Object.assign(existConfig.categories, config.categories);
		} else {
			existConfig = Object.assign({}, config);
			Reflect.set(target.prototype, "log4js", config);
		}
		log4js.configure(config);
	};
}
