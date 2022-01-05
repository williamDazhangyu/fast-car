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
const Field_1 = require("../../../src/annotation/mapper/Field");
const DBType_1 = require("../../../src/annotation/mapper/DBType");
const PrimaryKey_1 = require("../../../src/annotation/mapper/PrimaryKey");
const Table_1 = require("../../../src/annotation/Table");
const MaxLength_1 = require("../../../src/annotation/mapper/MaxLength");
const NotNull_1 = require("../../../src/annotation/mapper/NotNull");
require("reflect-metadata");
let Test = class Test {
    constructor(...args) {
        this.flag = true;
        this.money = 1.0;
        Object.assign(this, ...args);
    }
};
__decorate([
    Field_1.default("id"),
    DBType_1.default("int"),
    PrimaryKey_1.default,
    __metadata("design:type", Number)
], Test.prototype, "id", void 0);
__decorate([
    Field_1.default("name"),
    DBType_1.default("varchar"),
    MaxLength_1.default(10),
    NotNull_1.default,
    __metadata("design:type", String)
], Test.prototype, "name", void 0);
__decorate([
    Field_1.default("case_name"),
    DBType_1.default("varchar"),
    MaxLength_1.default(20),
    __metadata("design:type", String)
], Test.prototype, "caseName", void 0);
__decorate([
    Field_1.default("case_time"),
    DBType_1.default("datetime"),
    __metadata("design:type", Date)
], Test.prototype, "caseTime", void 0);
__decorate([
    Field_1.default("flag"),
    DBType_1.default("tinyint"),
    __metadata("design:type", Boolean)
], Test.prototype, "flag", void 0);
__decorate([
    Field_1.default("money"),
    DBType_1.default("decimal"),
    __metadata("design:type", Number)
], Test.prototype, "money", void 0);
Test = __decorate([
    Table_1.default("test"),
    __metadata("design:paramtypes", [Object])
], Test);
exports.default = Test;
