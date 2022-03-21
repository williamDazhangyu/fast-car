"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const annotation_1 = require("fastcar-core/annotation");
const RedisDataSourceManager_1 = require("./RedisDataSourceManager");
const fastcar_core_1 = require("fastcar-core");
/***
 * @version 1.0 redis操作模板
 *
 */
class RedisTemplate {
    set(key, value, source) {
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
    setExpire(key, value, seconds, source) {
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
    get(key, source) {
        return new Promise((resolve, reject) => {
            let client = this.db.getClient(source);
            if (!client) {
                reject(new Error("redis source not found"));
                return;
            }
            client.get(key, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    //自增key键
    incrKey(key, source) {
        return new Promise((resolve, reject) => {
            let client = this.db.getClient(source);
            if (!client) {
                reject(new Error("redis source not found"));
                return;
            }
            client.incr(key, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    //自减key键
    decrKey(key, source) {
        return new Promise((resolve, reject) => {
            let client = this.db.getClient(source);
            if (!client) {
                reject(new Error("redis source not found"));
                return;
            }
            client.decr(key, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    //是否存在key
    existKey(key, source) {
        return new Promise((resolve, reject) => {
            let client = this.db.getClient(source);
            if (!client) {
                reject(new Error("redis source not found"));
                return;
            }
            client.exists(key, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(!!data);
                }
            });
        });
    }
    //获取批量键值对
    getBulkKey(key, source) {
        return new Promise((resolve, reject) => {
            let client = this.db.getClient(source);
            if (!client) {
                reject(new Error("redis source not found"));
                return;
            }
            client.keys(key, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    delKey(key, source) {
        return new Promise((resolve, reject) => {
            let client = this.db.getClient(source);
            if (!client) {
                reject(new Error("redis source not found"));
                return;
            }
            client.del(key, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(!!res);
                }
            });
        });
    }
    delKeys(key, source) {
        return new Promise((resolve, reject) => {
            let client = this.db.getClient(source);
            if (!client) {
                reject(new Error("redis source not found"));
                return;
            }
            client.evalsha(key, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    //执行lua脚本
    execLua(luaStr, keysLength, param, source) {
        return new Promise((resolve, reject) => {
            let client = this.db.getClient(source);
            if (!client) {
                reject(new Error("redis source not found"));
                return;
            }
            client.eval(luaStr, keysLength, param, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
}
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", RedisDataSourceManager_1.default)
], RedisTemplate.prototype, "db", void 0);
__decorate([
    annotation_1.Log("redis"),
    __metadata("design:type", fastcar_core_1.Logger)
], RedisTemplate.prototype, "sysLogger", void 0);
__decorate([
    __param(2, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "set", null);
__decorate([
    __param(3, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "setExpire", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "get", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "incrKey", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "decrKey", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "existKey", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "getBulkKey", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "delKey", null);
__decorate([
    __param(1, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "delKeys", null);
__decorate([
    __param(3, annotation_1.DSIndex),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String]),
    __metadata("design:returntype", Promise)
], RedisTemplate.prototype, "execLua", null);
exports.default = RedisTemplate;
