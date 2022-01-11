"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
const TypeUtil_1 = require("../../utils/TypeUtil");
const ValidationUtil_1 = require("../../utils/ValidationUtil");
//动态数据源获取 根据就近原则 传入参数-函数-类名
function DS(name) {
    return function (target, methodName, descriptor) {
        if (methodName && descriptor) {
            const orignFunction = descriptor.value;
            //定义数据源
            Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.DS, name, target, methodName);
            //取出ds标记的位置 在编译前规避这个问题
            const dsIndex = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.DSIndex, target, methodName);
            if (!ValidationUtil_1.default.isNumber(dsIndex)) {
                throw new Error(`${methodName} function dynamic data source not found`);
            }
            descriptor.value = function (...args) {
                let dsName = args[dsIndex];
                if (!dsName) {
                    args[dsIndex] = name;
                }
                return Promise.resolve(Reflect.apply(orignFunction, this, args));
            };
        }
        else {
            Reflect.defineMetadata(FastCarMetaData_1.FastCarMetaData.DS, name, target.prototype);
            //找所有的方法 将符合要求的进行注入定义
            let targetProto = target.prototype;
            let keys = Reflect.ownKeys(targetProto);
            for (let key of keys) {
                let dsIndex = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.DSIndex, targetProto, key);
                if (ValidationUtil_1.default.isNumber(dsIndex)) {
                    let originValue = Reflect.get(targetProto, key);
                    if (TypeUtil_1.default.isFunction(originValue)) {
                        Reflect.defineProperty(targetProto, key, {
                            value: function (...args) {
                                let dsName = args[dsIndex];
                                if (!dsName) {
                                    let fnDSName = Reflect.getMetadata(FastCarMetaData_1.FastCarMetaData.DS, targetProto, key);
                                    args[dsIndex] = fnDSName || name;
                                }
                                return Promise.resolve(Reflect.apply(originValue, this, args));
                            },
                        });
                    }
                }
            }
        }
    };
}
exports.default = DS;
