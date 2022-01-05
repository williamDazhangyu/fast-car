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
const TestMapper_1 = require("../mapper/TestMapper");
const Test_1 = require("../model/Test");
let SimpleService = class SimpleService {
    constructor() { }
    //查询
    async query() {
        let res = await this.myMapper.selectOne({
            where: {
                name: {
                    value: "hello",
                },
            },
        });
        return res;
    }
    //更新或者添加
    async saveUpdate() {
        let test = new Test_1.default({ name: "ABC", caseTime: new Date() });
        let res = await this.myMapper.saveORUpdate(test);
        return res;
    }
    //添加
    async saveOne() {
        let test = new Test_1.default({ name: "aaa", caseTime: new Date(), money: 100000000 });
        let res = await this.myMapper.saveOne(test);
        return res;
    }
    //批量添加
    async saveList() {
        let test = new Test_1.default({ name: "bbb" });
        let test2 = new Test_1.default({ name: "ccc" });
        let res = await this.myMapper.saveList([test, test2]);
        return res;
    }
    //更新
    async update() {
        let res = await this.myMapper.update({ where: { id: 1 }, row: { name: "ABCD" } });
        return res;
    }
    async updateOne() {
        let row = { name: "ABCDE" };
        let res = await this.myMapper.updateOne({ where: { id: 1 }, row });
        return res;
    }
    async updateByPrimaryKey() {
        let test = new Test_1.default({ id: 1, name: "1234" });
        let res = await this.myMapper.updateByPrimaryKey(test);
        return res;
    }
    async selectOne() {
        let res = await this.myMapper.selectOne({
            where: {
                name: "1234",
            },
        });
        return res;
    }
    async exist() {
        let res = await this.myMapper.exist({
            name: "124",
        });
        return res;
    }
    async count() {
        let countNum = await this.myMapper.count({ id: 1 });
        return countNum;
    }
    async delete() {
        let res = await this.myMapper.delete({
            where: {
                name: "bbb",
            },
        });
        return res;
    }
};
__decorate([
    annotation_1.Autowired,
    __metadata("design:type", TestMapper_1.default)
], SimpleService.prototype, "myMapper", void 0);
SimpleService = __decorate([
    annotation_1.Service,
    __metadata("design:paramtypes", [])
], SimpleService);
exports.default = SimpleService;
