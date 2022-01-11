import RedisDataSource from "./RedisDataSource";
import * as redis from "redis";
import { ApplicationStart, ApplicationStop, Autowired } from "fastcar-core/annotation";
import { BootPriority, FastCarApplication, Logger } from "fastcar-core";

interface RedisConfig extends redis.ClientOpts {
	source: string;
}

@ApplicationStart(BootPriority.Base, "start")
@ApplicationStop(BootPriority.Lowest, "stop")
class RedisDataSourceManager {
	sourceMap: Map<string, RedisDataSource>;

	@Autowired
	protected app!: FastCarApplication;

	@Autowired
	protected sysLogger!: Logger;

	constructor() {
		this.sourceMap = new Map();
	}

	start(): void {
		let config: RedisConfig[] = this.app.getSetting("redis");
		if (config && Array.isArray(config)) {
			config.forEach(item => {
				let source = item.source;
				Reflect.deleteProperty(item, "source");
				let client = new RedisDataSource(item);
				this.sourceMap.set(source, client);
			});
		} else {
			this.sysLogger.warn("Redis configuration not found");
		}
	}

	stop(): void {
		this.sourceMap.forEach(client => {
			client.close();
		});

		this.sourceMap.clear();
	}

	getClient(source: string = "default") {
		let dbSource = this.sourceMap.get(source);
		return dbSource;
	}

	set(key: string, value: string | Object, source?: string): Promise<string> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			let s = typeof value == "object" ? JSON.stringify(value) : value;

			client.set(key, s, (err, res) => {
				if (err) {
					console.error("redis errors set");
					console.error(err);
					reject(err);
					return;
				}

				resolve(res);
			});
		});
	}

	setExpire(key: string, value: string | Object, seconds: number, source?: string): Promise<number> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			let s = typeof value == "object" ? JSON.stringify(value) : value;

			client.set(key, s, (err, res) => {
				if (err) {
					console.error("redis errors set");
					console.error(err);
					reject(err);
					return;
				}

				client.expire(key, seconds, (err2, res2) => {
					resolve(res2);
				});
			});
		});
	}

	get(key: string, source?: string): Promise<string | null> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			client.get(key, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
		});
	}

	//自增key键
	incrKey(key: string, source?: string): Promise<number> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			client.incr(key, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}

	//自减key键
	decrKey(key: string, source?: string): Promise<number> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			client.decr(key, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}

	//是否存在key
	existKey(key: string, source?: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			client.exists(key, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(!!data);
				}
			});
		});
	}

	//获取批量键值对
	getBulkKey(key: string, source?: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			client.keys(key, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
		});
	}

	delKey(key: string, source?: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			client.del(key, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(!!res);
				}
			});
		});
	}

	delKeys(key: string, source?: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			client.evalsha(key, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
		});
	}

	//执行lua脚本
	execLua(luaStr: string, keysLength: number, param: string, source?: string): Promise<any> {
		return new Promise((resolve, reject) => {
			let dbSource = this.getClient(source);
			if (!dbSource) {
				reject(new Error("redis source not found"));
				return;
			}

			let client = dbSource.getClient();
			client.eval(luaStr, keysLength, param, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
		});
	}
}

export default RedisDataSourceManager;
