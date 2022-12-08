import { Autowired, DSIndex, Log } from "@fastcar/core/annotation";
import RedisDataSourceManager from "./RedisDataSourceManager";
import { Logger } from "@fastcar/core";

/***
 * @version 1.0 redis操作模板
 *
 */
export default class RedisTemplate {
	@Autowired
	private db!: RedisDataSourceManager;

	@Log("redis")
	protected sysLogger!: Logger;

	set(key: string, value: string | Object, @DSIndex source?: string): Promise<string> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

			let s = typeof value == "object" ? JSON.stringify(value) : value;
			client.set(key, s, (err, res) => {
				if (err) {
					this.sysLogger.error("redis errors set");
					this.sysLogger.error(err);
					reject(err);
					return;
				}

				resolve(res);
			});
		});
	}

	setExpire(key: string, value: string | Object, seconds: number, @DSIndex source?: string): Promise<number> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

			let s = typeof value == "object" ? JSON.stringify(value) : value;
			client.set(key, s, (err, res) => {
				if (err) {
					this.sysLogger.error("redis errors set");
					this.sysLogger.error(err);
					reject(err);
					return;
				}

				client?.expire(key, seconds, (err2, res2) => {
					resolve(res2);
				});
			});
		});
	}

	get(key: string, @DSIndex source?: string): Promise<string | null> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

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
	incrKey(key: string, @DSIndex source?: string): Promise<number> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

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
	decrKey(key: string, @DSIndex source?: string): Promise<number> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

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
	existKey(key: string, @DSIndex source?: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

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
	getBulkKey(key: string, @DSIndex source?: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

			client.keys(key, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
		});
	}

	delKey(key: string, @DSIndex source?: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

			client.del(key, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(!!res);
				}
			});
		});
	}

	delKeys(key: string, @DSIndex source?: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

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
	execLua(luaStr: string, keysLength: number, param: string, @DSIndex source?: string): Promise<any> {
		return new Promise((resolve, reject) => {
			let client = this.db.getClient(source);
			if (!client) {
				reject(new Error("redis source not found"));
				return;
			}

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
