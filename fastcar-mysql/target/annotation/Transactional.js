"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const fastcar_core_1 = require("fastcar-core");
const annotation_1 = require("fastcar-core/annotation");
const MysqlDataSourceManager_1 = require("../dataSource/MysqlDataSourceManager");
const SqlError_1 = require("../type/SqlError");
const DesignMeta_1 = require("../type/DesignMeta");
/**
 * @version 1.0 事务管理 不建议多个事务的嵌套(避免长事务) 尽量做到一个方法一个事务
 * */
function Transactional(target, methodName, descriptor) {
    const orignFunction = descriptor.value;
    //注入app组件用于遍历组件
    annotation_1.AddRequireModule(target, fastcar_core_1.FastCarMetaData.APP, fastcar_core_1.FastCarMetaData.APP);
    //在初始化时就应该检测是否注入了sessionID
    const paramsIndex = Reflect.getOwnMetadata(DesignMeta_1.DesignMeta.sqlSession, target, methodName);
    if (typeof paramsIndex != "number") {
        throw new SqlError_1.default(`${methodName} needs to inject the SqlSession`);
    }
    descriptor.value = async function (...args) {
        //创建会话id
        let app = Reflect.get(this, fastcar_core_1.FastCarMetaData.APP);
        let sysLogger = app.getComponentByName("SysLogger");
        let dsm = app.getComponentByTarget(MysqlDataSourceManager_1.default);
        if (!dsm) {
            sysLogger.error(`MysqlDataSourceManager not found`);
            return Promise.reject(new SqlError_1.default(`MysqlDataSourceManager not found`));
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
}
exports.default = Transactional;
