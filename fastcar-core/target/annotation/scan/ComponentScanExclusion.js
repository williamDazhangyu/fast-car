"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path = require("path");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
//和本包的相对路径
function ComponentScanExclusion(...names) {
    return function (target) {
        let ScanExcludePathList = FastCarMetaData_1.FastCarMetaData.ComponentScanExclusion;
        let list = Reflect.getMetadata(ScanExcludePathList, target.prototype) || [];
        for (let name of names) {
            //转化成绝对路径
            let p = path.join(require.main?.path || "", name);
            if (!list.includes(p)) {
                list.push(p);
            }
        }
        Reflect.defineMetadata(ScanExcludePathList, list, target.prototype);
    };
}
exports.default = ComponentScanExclusion;
