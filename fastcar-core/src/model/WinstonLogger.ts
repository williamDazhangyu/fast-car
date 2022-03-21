import * as winston from "winston";
import { ColorLevelType, WinstonLoggerType } from "../type/WinstonLoggerType";
import * as path from "path";
import { DateUtil, ValidationUtil } from "../utils";
import * as util from "util";
const SPLAT = Symbol.for("splat");

export default class WinstonLogger {
	protected config: WinstonLoggerType;
	protected categoryMap: Map<string, winston.Logger>;

	constructor(config: WinstonLoggerType) {
		this.config = config;
		this.categoryMap = new Map();
	}

	//控制台着色
	private colorize(str: string, level: string) {
		let colorStyle = Reflect.get(ColorLevelType, level);
		if (!colorStyle) {
			return str;
		}

		return `\x1B[${colorStyle[0]}m ${str} \x1B[${colorStyle[1]}m`;
	}

	setConfig(config: WinstonLoggerType) {
		this.config = config;
	}

	hasLogger(category: string): boolean {
		return winston.loggers.has(category);
	}

	getLogger(category: string): winston.Logger | undefined {
		return this.categoryMap.get(category);
	}

	addLogger(category: string) {
		if (this.categoryMap.has(category)) {
			winston.loggers.close(category);
		}

		let newLogger = winston.loggers.add(category, {
			format: winston.format.combine(
				winston.format.label({ label: category }),
				winston.format.printf(info => {
					//debug模式等级时仅为控制台输出
					let level = info.level.toUpperCase();
					let timestamp = DateUtil.toDateTimeMS();

					let content = {
						timestamp,
						level,
						label: info.label,
						message: info.message,
					};

					if (Reflect.has(info, SPLAT)) {
						Reflect.set(content, "splat", JSON.stringify(Reflect.get(info, SPLAT)));
					}

					if (info.stack) {
						Reflect.set(content, "stack", info.stack);
					}

					Reflect.set(info, "timestamp", content.timestamp);

					//新增打印控制台
					if (this.config.printConsole) {
						let text = this.colorize(util.format("[%s] [%s] %s - ", timestamp, level, info.label), info.level);
						text += ValidationUtil.isObject(content.message) ? JSON.stringify(content.message) : content.message;

						if (Reflect.has(info, SPLAT)) {
							let splatMsg = Reflect.get(info, SPLAT);
							text += " " + JSON.stringify(splatMsg);
						}

						if (info.stack) {
							text += `\nstatck: ${info.stack}`;
						}
						let fn = console.info;
						if (Reflect.has(console, info.level)) {
							fn = Reflect.get(console, info.level);
						}

						Reflect.apply(fn, console, [text]);
					}

					return util.format("%j", content);
				})
			),

			transports: [
				new winston.transports.File({
					level: this.config.fileLevel,
					filename: path.join(this.config.rootPath, `${category}.log`),
					maxsize: this.config.maxsize,
					maxFiles: this.config.maxFiles,
				}),
			],
		});

		this.categoryMap.set(category, newLogger);
		return newLogger;
	}

	getLoggerList(): winston.Logger[] {
		return [...this.categoryMap.values()];
	}
}
