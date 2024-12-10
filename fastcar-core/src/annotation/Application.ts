import { ClassConstructor } from "../type/ClassConstructor";
import ClassUtils from "../utils/ClassUtils";
import TypeUtil from "../utils/TypeUtil";

//基础服务的应用
export default function Application(target: any) {
	return new Proxy(target, {
		construct: (target: ClassConstructor<Object>, args: any, newTarget?: any) => {
			const FastCarApplication = require("../FastCarApplication").default;

			let app = new FastCarApplication();
			let appProxy = Reflect.construct(target, args, newTarget);
			Reflect.set(appProxy, "app", app);

			let keys = ClassUtils.getProtoType(target);
			for (let key of keys) {
				if (key != "constructor") {
					let desc = ClassUtils.getProtoDesc(target, key);
					if (desc) {
						let beforeFun = Object.getOwnPropertyDescriptor(FastCarApplication.prototype, key)?.value;
						let afterFun = desc.value;

						if (Reflect.has(app, key) && TypeUtil.isFunction(afterFun) && TypeUtil.isFunction(beforeFun)) {
							let mixFn = async (...args: any[]) => {
								let res: any;
								if (TypeUtil.isPromise(beforeFun)) {
									res = await Promise.resolve(Reflect.apply(beforeFun, app, args));
								} else {
									res = Reflect.apply(beforeFun, app, args);
								}

								TypeUtil.isPromise(afterFun) ? await Promise.resolve(Reflect.apply(afterFun, appProxy, args)) : Reflect.apply(afterFun, appProxy, args);
								return res;
							};

							Reflect.defineProperty(app, key, Object.assign(desc, { value: mixFn }));
						} else {
							Reflect.defineProperty(app, key, desc);
						}
					}
				}
			}

			app.loadLoggerIOC(appProxy);
			app.init();
			return appProxy;
		},
	});
}
