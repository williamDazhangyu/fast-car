import * as log4js from "log4js";

describe("日志测试", () => {
	it("日志测试测试", () => {
		log4js.configure({
			appenders: {
				loggerInfo: { type: "dateFile", filename: "project/unitTesting/logs/log", pattern: ".yyyy-MM-dd.log", maxLogSize: 1048576, backups: 4, alwaysIncludePattern: true },
				loggerError: { type: "file", filename: "project/unitTesting/logs/errlog.log", maxLogSize: 1048576, level: "INFO" },
			},
			categories: {
				default: { appenders: ["loggerInfo"], level: "trace" },
				loggerError: { appenders: ["loggerError"], level: "info" },
			},
			pm2: true,
		});

		const logger = log4js.getLogger("loggerInfo");

		console.log = (...args: any[]) => {
			logger.error("sss");
		};

		console.log("2322");
		// console.error();
	});
});
