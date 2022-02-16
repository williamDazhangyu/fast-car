import FastCarApplication from "../FastCarApplication";
import TypeUtil from "../utils/TypeUtil";

//基础服务的应用
export default function Application(target: any) {
	return new Proxy(target, {
		construct: (target: any, args: any) => {
			let app = new FastCarApplication();
			let appProxy = new target(...args);
			Reflect.set(appProxy, "app", app);

			let keys = Reflect.ownKeys(target.prototype);
			for (let key of keys) {
				if (key != "constructor") {
					let desc = Object.getOwnPropertyDescriptor(target.prototype, key);
					if (desc) {
						let beforeFun = Object.getOwnPropertyDescriptor(FastCarApplication.prototype, key)?.value;
						let afterFun = desc.value;

						if (Reflect.has(app, key) && TypeUtil.isFunction(afterFun) && TypeUtil.isFunction(beforeFun)) {
							let mixFn = async (...args: any[]) => {
								let res = await Promise.resolve(Reflect.apply(beforeFun, app, args));
								await Promise.resolve(Reflect.apply(afterFun, appProxy, args));
								return res;
							};
							Reflect.defineProperty(app, key, { value: mixFn });
						} else {
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
