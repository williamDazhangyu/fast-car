"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const annotation_1 = require("fastcar-core/annotation");
const Entity_1 = require("../../../src/annotation/Entity");
const MysqlMapper_1 = require("../../../src/operation/MysqlMapper");
const Test_1 = require("../model/Test");
let TestMapper = class TestMapper extends MysqlMapper_1.default {
};
TestMapper = __decorate([
    Entity_1.default(Test_1.default),
    annotation_1.Repository
], TestMapper);
exports.default = TestMapper;
