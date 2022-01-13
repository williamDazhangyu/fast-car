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
Object.defineProperty(exports, "__esModule", { value: true });
const RedisDataSource_1 = require("./RedisDataSource");
const annotation_1 = require("fastcar-core/annotation");
const fastcar_core_1 = require("fastcar-core");
/***
 * @version 1.0 redis数据源管理
 */
let RedisDataSourceManager = class RedisDataSourceManager {
    constructor() {
        this.sourceMap = new Map();
    }
    start() {
        let config = this.app.getSetting("redis");
        if (config && Array.isArray(config)) {
            config.forEach(item => {
                let source = item.source;
                Reflect.deleteProperty(item, "source");
                let client = new RedisDataSource_1.default(item);
                this.sourceMap.set(source, client);
            });
        }
        else {
            this.sysLogger.warn("Redis configuration not found");
        }
    }
    stop() {
        this.sourceMap.forEach(client => {
            client.close();
        });
        this.sourceMap.clear();
    }
    getClient(source = "default") {
        let client = this.sourceMap.get(source);
        if (!client) {
            return null;
        }
        return client.getClient();
    }
};
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", fastcar_core_1.FastCarApplication)
], RedisDataSourceManager.prototype, "app", void 0);
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", fastcar_core_1.Logger)
], RedisDataSourceManager.prototype, "sysLogger", void 0);
RedisDataSourceManager = __decorate([
    annotation_1.ApplicationStart(fastcar_core_1.BootPriority.Base, "start"),
    annotation_1.ApplicationStop(fastcar_core_1.BootPriority.Lowest, "stop"),
    __metadata("design:paramtypes", [])
], RedisDataSourceManager);
exports.default = RedisDataSourceManager;
