"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypeUtil_1 = require("./TypeUtil");
const FileUtil_1 = require("./FileUtil");
const fs = require("fs");
class ClassLoader {
    /***
     * @version 1.0 加载模块
     * @version 1.1 新增是否强制重载模块
     *
     */
    static loadModule(filePath, force = false) {
        //校验后缀名是否为js或者ts
        if (!TypeUtil_1.default.isTSORJS(filePath)) {
            return null;
        }
        //避免重复加载或者想要重新进行挂载
        if (Reflect.has(require.cache, filePath)) {
            if (force) {
                Reflect.deleteProperty(require.cache, filePath);
            }
        }
        //可能不止一个方法
        const modulesMap = new Map();
        //进行方法加载
        let moduleClass = require.cache?.filePath || require(filePath);
        let keys = Object.keys(moduleClass);
        let fileName = FileUtil_1.default.getFileName(filePath);
        keys.forEach(key => {
            let instance = moduleClass[key];
            if (TypeUtil_1.default.isFunction(instance)) {
                modulesMap.set(instance.name, instance);
                return;
            }
            if (TypeUtil_1.default.isObject(instance)) {
                modulesMap.set(fileName, instance);
            }
        });
        return modulesMap;
    }
    static watchServices(fp, context) {
        if (typeof context.emit != "function") {
            return false;
        }
        //添加热更方法
        fs.watch(fp, function (event, filename) {
            if (event === "change") {
                console.log("热更加载----", filename);
                context.emit("reload", fp);
            }
        });
        return true;
    }
}
exports.default = ClassLoader;
