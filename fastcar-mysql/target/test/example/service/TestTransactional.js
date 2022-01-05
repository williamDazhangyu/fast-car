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
const SqlSession_1 = require("../../../src/annotation/SqlSession");
const Transactional_1 = require("../../../src/annotation/Transactional");
const MysqlDataSourceManager_1 = require("../../../src/dataSource/MysqlDataSourceManager");
const TestMapper_1 = require("../mapper/TestMapper");
let TestTransactional = class TestTransactional {
    async exec() {
        let sql = "update test set flag = 0 where id = 1 ";
        let sql2 = "update test set flag = 0 where id = 2";
        try {
            let res = await this.dsm.batchExecute([{ sql }, { sql: sql2 }]);
            return res;
        }
        catch (e) {
            return null;
        }
    }
    //必须是sessionId和Transactional配合使用，然后只有传入sessionId的执行语句才会生效
    async work(sessionId) {
        let res = await this.myMapper.updateOne({
            where: { id: 1 },
            row: { case_time: new Date() },
        }, sessionId);
        let sql2 = "select * from noExistTable";
        await this.myMapper.execute(sql2, [], sessionId);
        return res;
    }
    //并发执行 但切记不要一次并发太多导致导致并发连接数占用过多
    async bacthExec(sessionId) {
        let res = await Promise.all([
            this.myMapper.updateOne({
                where: { id: 2 },
                row: { case_time: new Date() },
            }, sessionId),
            this.myMapper.updateOne({
                where: { id: 3 },
                row: { case_time: new Date() },
            }, sessionId),
            this.myMapper.updateOne({
                where: { id: 1 },
                row: { case_time: new Date() },
            }, sessionId),
            // this.myMapper.execute("select * from noExistTable", [], sessionId),
        ]);
        return res;
    }
    //嵌套执行
    async firstWork(sessionId) {
        await this.myMapper.updateOne({
            where: { id: 2 },
            row: { case_time: new Date() },
        }, sessionId);
        //调用嵌套的
        return await this.secondWork(sessionId);
    }
    async secondWork(sessionId) {
        let res = await this.myMapper.updateOne({
            where: { id: 3 },
            row: { case_time: new Date() },
        }, sessionId);
        return res;
    }
};
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", TestMapper_1.default)
], TestTransactional.prototype, "myMapper", void 0);
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", MysqlDataSourceManager_1.default)
], TestTransactional.prototype, "dsm", void 0);
__decorate([
    Transactional_1.default,
    __param(0, SqlSession_1.default),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestTransactional.prototype, "work", null);
__decorate([
    Transactional_1.default,
    __param(0, SqlSession_1.default),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestTransactional.prototype, "bacthExec", null);
__decorate([
    Transactional_1.default,
    __param(0, SqlSession_1.default),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestTransactional.prototype, "firstWork", null);
__decorate([
    Transactional_1.default,
    __param(0, SqlSession_1.default),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestTransactional.prototype, "secondWork", null);
TestTransactional = __decorate([
    annotation_1.Service
], TestTransactional);
exports.default = TestTransactional;
