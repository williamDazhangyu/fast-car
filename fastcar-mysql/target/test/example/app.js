"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const annotation_1 = require("fastcar-core/annotation");
const EnableMysql_1 = require("../../src/annotation/EnableMysql");
let APP = class APP {
};
APP = __decorate([
    annotation_1.Application,
    EnableMysql_1.default //开启mysql数据库
    ,
    annotation_1.Log()
], APP);
const appInstance = new APP();
console.log("crud测试");
let service = appInstance.app.getComponentByName("SimpleService");
//详情看更多的内部测试
service.saveOne().then((res) => {
    console.log(res);
});
let service2 = appInstance.app.getComponentByName("TestTransactional");
console.log("纯sql测试");
service2.exec();
console.log("事务执行测试");
service2
    .work()
    .then((res) => {
    console.log(res);
})
    .catch((e) => {
    console.error("service2");
    console.error(e);
});
console.log("事务嵌套测试");
service2
    .firstWork()
    .then((res) => {
    console.log(res);
})
    .catch((e) => {
    console.error(e);
});
