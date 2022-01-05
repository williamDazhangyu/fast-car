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
require("reflect-metadata");
function SessionId(target, name, index) {
    console.log("调用次数----");
    Reflect.defineMetadata("sessionId", index, target, name);
}
function Transactional(target, name, descriptor) {
    let orignFunction = descriptor.value;
    descriptor.value = function (...args) {
        let sessionInfo = Reflect.getMetadata("sessionId", target, name);
        if (sessionInfo) {
            args[sessionInfo] = "123";
        }
        return Reflect.apply(orignFunction, this, args);
    };
}
class A {
    word(a, c, b) {
        console.log(a, b, c);
    }
}
__decorate([
    Transactional,
    __param(2, SessionId),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], A.prototype, "word", null);
new A().word("1", "2");
