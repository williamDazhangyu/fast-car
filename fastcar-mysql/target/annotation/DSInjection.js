"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastcar_core_1 = require("fastcar-core");
const annotation_1 = require("fastcar-core/annotation");
require("reflect-metadata");
const SqlError_1 = require("../type/SqlError");
//动态数据源注入
function DSInjection(read = true) {
    return function (target, name, descriptor) {
        annotation_1.AddRequireModule(target, fastcar_core_1.FastCarMetaData.APP, fastcar_core_1.FastCarMetaData.APP);
        const orignFunction = descriptor.value;
        //取出ds标记的位置 在编译前规避这个问题
        const dsIndex = Reflect.getMetadata(fastcar_core_1.FastCarMetaData.DSIndex, target, name);
        if (typeof dsIndex != "number") {
            throw new SqlError_1.default(`${name} dynamic data source not found`);
        }
        descriptor.value = function (...args) {
            let dsName = args[dsIndex];
            if (!dsName) {
                let fnDefaultDS = Reflect.getMetadata(fastcar_core_1.FastCarMetaData.DS, target, name);
                let classDefaultDS = Reflect.getMetadata(fastcar_core_1.FastCarMetaData.DS, target);
                dsName = fnDefaultDS || classDefaultDS;
                if (!dsName) {
                    let app = Reflect.get(this, fastcar_core_1.FastCarMetaData.APP);
                    let dsm = app.getComponentByName("MysqlDataSourceManager");
                    dsName = dsm.getDefaultSoucre(read);
                }
                args[dsIndex] = dsName;
            }
            return Promise.resolve(Reflect.apply(orignFunction, this, args));
        };
    };
}
exports.default = DSInjection;
