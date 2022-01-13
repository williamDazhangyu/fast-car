"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
class RedisDataSource {
    constructor(config) {
        const client = redis.createClient(config);
        client.on("error", function (err) {
            console.error("redis error");
            console.error(err);
        });
        this.client = client;
        this.checkClient();
    }
    checkClient() {
        this.client.ping();
    }
    getClient() {
        return this.client;
    }
    close() {
        this.client.end();
    }
}
exports.default = RedisDataSource;
