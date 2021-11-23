import RedisDataSource from './RedisDataSource';
import * as redis from "redis";

interface redisConfig extends redis.ClientOpts {

    source: string;
}

class RedisService {

    dataSource: Map<string, RedisDataSource>;

    constructor(configList: redisConfig[]) {

        this.dataSource = new Map();

        for (let c of configList) {

            let r = new RedisDataSource(c);
            this.dataSource.set(c.source, r);
        }
    }

    getClient(source: string = "default") {

        let dbSource = this.dataSource.get(source);
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
            let s = typeof value == "object" ?
                JSON.stringify(value) : value;

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
    };

    setExpire(key: string, value: string | Object, seconds: number, source?: string): Promise<number> {

        return new Promise((resolve, reject) => {

            let dbSource = this.getClient(source);
            if (!dbSource) {

                reject(new Error("redis source not found"));
                return;
            }

            let client = dbSource.getClient();
            let s = typeof value == "object" ?
                JSON.stringify(value) : value;

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
    };

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
    };

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
    };

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
    };

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
    };

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
    };
}

export default RedisService;