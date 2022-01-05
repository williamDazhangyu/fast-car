"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const FileUtil_1 = require("../../utils/FileUtil");
const Mix_1 = require("../../utils/Mix");
const Component_1 = require("./Component");
//配置文件层
function Configure(name) {
    return function (target) {
        //配置对象也为组件
        Component_1.default(target);
        //当实例化时 加载默认配置并进行赋值
        let fp = path.join(require.main?.path || module.path, "resource", name);
        let tmpConfig = FileUtil_1.default.getResource(fp);
        console.log("加载配置", name);
        //进行实例化赋值
        if (tmpConfig) {
            //进行赋值不改变基础属性
            Mix_1.default.copPropertyValue(target.prototype, tmpConfig);
        }
    };
}
exports.default = Configure;
