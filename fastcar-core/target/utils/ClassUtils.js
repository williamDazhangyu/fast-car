"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ClassUtils {
    //获取一个类所有的proto属性 采用递归的形式
    static getProtoType(t) {
        if (!t?.prototype) {
            return [];
        }
        let keys = Reflect.ownKeys(t?.prototype).map(item => {
            return item.toString();
        });
        let parentObj = Reflect.getPrototypeOf(t);
        if (!parentObj || !Reflect.has(parentObj, "prototype")) {
            return keys;
        }
        let parentKeys = ClassUtils.getProtoType(parentObj);
        let s = new Set([...keys, ...parentKeys]);
        return [...s];
    }
}
exports.default = ClassUtils;
