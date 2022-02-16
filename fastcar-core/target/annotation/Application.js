"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FastCarApplication_1 = require("../FastCarApplication");
const TypeUtil_1 = require("../utils/TypeUtil");
//基础服务的应用
function Application(target) {
    return new Proxy(target, {
        construct: (target, args) => {
            let app = new FastCarApplication_1.default();
            let appProxy = new target(...args);
            Reflect.set(appProxy, "app", app);
            let keys = Reflect.ownKeys(target.prototype);
            for (let key of keys) {
                if (key != "constructor") {
                    let desc = Object.getOwnPropertyDescriptor(target.prototype, key);
                    if (desc) {
                        let beforeFun = Object.getOwnPropertyDescriptor(FastCarApplication_1.default.prototype, key)?.value;
                        let afterFun = desc.value;
                        if (Reflect.has(app, key) && TypeUtil_1.default.isFunction(afterFun) && TypeUtil_1.default.isFunction(beforeFun)) {
                            let mixFn = async (...args) => {
                                let res = await Promise.resolve(Reflect.apply(beforeFun, app, args));
                                await Promise.resolve(Reflect.apply(afterFun, appProxy, args));
                                return res;
                            };
                            Reflect.defineProperty(app, key, { value: mixFn });
                        }
                        else {
                            Reflect.defineProperty(app, key, desc);
                        }
                    }
                }
            }
            app.init();
            return appProxy;
        },
    });
}
exports.default = Application;
