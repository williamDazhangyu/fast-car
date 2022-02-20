"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const LifeCycleModule_1 = require("../../constant/LifeCycleModule");
//配置文件层
function Configure(name) {
    return function (target) {
        //配置对象也为组件
        Component_1.default(target);
        //当实例化时 加载默认配置并进行赋值
        Reflect.defineMetadata(LifeCycleModule_1.LifeCycleModule.LoadConfigure, name, target);
    };
}
exports.default = Configure;
