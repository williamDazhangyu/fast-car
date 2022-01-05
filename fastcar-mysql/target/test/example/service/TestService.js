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
const annotation_1 = require("fastcar-core/annotation");
const MysqlDataSourceManager_1 = require("../../../src/dataSource/MysqlDataSourceManager");
const TestMapper_1 = require("../mapper/TestMapper");
let TestService = class TestService {
    async exec() {
        let sql = "update test set flag = 1 where id = 19 ";
        let sql2 = "select * from noExistTable";
        try {
            let res = await this.dsm.batchExecute([{ sql }, { sql: sql2 }]);
            return res;
        }
        catch (e) {
            return null;
        }
    }
    async work() {
        let sid = this.dsm.createSession();
        this.myMapper.select({ where: {}, sessionId: sid });
    }
};
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", TestMapper_1.default)
], TestService.prototype, "myMapper", void 0);
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", MysqlDataSourceManager_1.default)
], TestService.prototype, "dsm", void 0);
TestService = __decorate([
    annotation_1.Service
], TestService);
exports.default = TestService;
