"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
const DesignMeta_1 = require("../../type/DesignMeta");
const SqlError_1 = require("../../type/SqlError");
const AddRequireModule_1 = require("../AddRequireModule");
/**
 * @version 1.0 事务管理 不建议多个事务的嵌套(避免长事务) 尽量做到一个方法一个事务
 * */
function Transactional(driver = "MysqlDataSourceManager") {
    return function (target, methodName, descriptor) {
        const orignFunction = descriptor.value;
        //注入app组件用于遍历组件
        AddRequireModule_1.default(target, FastCarMetaData_1.FastCarMetaData.APP, FastCarMetaData_1.FastCarMetaData.APP);
        //在初始化时就应该检测是否注入了sessionID
        const paramsIndex = Reflect.getOwnMetadata(DesignMeta_1.DesignMeta.sqlSession, target, methodName);
        if (typeof paramsIndex != "number") {
            throw new SqlError_1.default(`${methodName} needs to inject the SqlSession`);
        }
        descriptor.value = async function (...args) {
            //创建会话id
            let app = Reflect.get(this, FastCarMetaData_1.FastCarMetaData.APP);
            let sysLogger = app.getComponentByName("SysLogger");
            let dsm = app.getComponentByName(driver);
            if (!dsm) {
                sysLogger.error(`DataSourceManager ${driver} not found`);
                return Promise.reject(new SqlError_1.default(`DataSourceManager ${driver} not found`));
            }
            let sessionId = args[paramsIndex];
            if (sessionId) {
                return Promise.resolve(Reflect.apply(orignFunction, this, args));
            }
            let errFlag = false;
            sessionId = dsm.createSession();
            args[paramsIndex] = sessionId;
            let res = null;
            return new Promise((resolve, reject) => {
                Reflect.apply(orignFunction, this, args)
                    .then((result) => {
                    res = result;
                })
                    .catch((e) => {
                    sysLogger.error(e);
                    errFlag = true;
                })
                    .finally(async () => {
                    await dsm.destorySession(sessionId, errFlag);
                    return !errFlag ? resolve(res) : reject(new SqlError_1.default(`${methodName} exec fail `));
                });
            });
        };
    };
}
exports.default = Transactional;
