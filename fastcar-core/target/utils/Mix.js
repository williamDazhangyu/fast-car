"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BASETYPE = ["constructor", "prototype", "name"];
/***
 * @version 1.0 混合多个类
 *
 */
class MixTool {
    static mix(...mixins) {
        class Mix {
            constructor() {
                for (let mixin of mixins) {
                    MixTool.copyProperties(this, new mixin()); // 拷贝实例属性
                }
            }
        }
        for (let mixin of mixins) {
            MixTool.copyProperties(Mix, mixin); // 拷贝静态属性
            MixTool.copyProperties(Mix.prototype, mixin.prototype); // 拷贝原型属性
        }
        return Mix;
    }
    static copyProperties(target, source) {
        let keys = Reflect.ownKeys(source);
        for (let key of keys) {
            if (!BASETYPE.includes(key.toString())) {
                let desc = Object.getOwnPropertyDescriptor(source, key);
                if (desc) {
                    Object.defineProperty(target, key, desc);
                }
            }
        }
    }
    //仅仅改变属性的值
    static copPropertyValue(target, source) {
        let keys = Reflect.ownKeys(source);
        for (let key of keys) {
            if (!BASETYPE.includes(key.toString())) {
                let desc = Reflect.getOwnPropertyDescriptor(source, key);
                if (!!desc) {
                    Reflect.defineProperty(target, key, {
                        value: desc.value,
                    });
                }
            }
        }
    }
}
exports.default = MixTool;
