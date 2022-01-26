"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const FastCarMetaData_1 = require("../../constant/FastCarMetaData");
function ComponentInjection(target, ...names) {
    let ScanPathList = FastCarMetaData_1.FastCarMetaData.ComponentScan;
    let list = Reflect.get(target.prototype, ScanPathList) || [];
    for (let name of names) {
        //可支持绝对路径
        let p = path.join(require.main?.path || "", name);
        if (fs.existsSync(name)) {
            p = name;
        }
        if (!list.includes(p)) {
            list.push(p);
        }
    }
    Reflect.set(target.prototype, ScanPathList, list);
}
exports.default = ComponentInjection;
