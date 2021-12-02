import TypeUtil from "./TypeUtil";
import FileUtil from "./FileUtil";

export default class ClassLoader {
	/***
	 * @version 1.0 加载模块
	 * @version 1.1 新增是否强制重载模块
	 *
	 */
	static loadModule(filePath: string, force: boolean = false): Map<string, any> | null {
		//校验后缀名是否为js或者ts
		if (!TypeUtil.isTSORJS(filePath)) {
			return null;
		}

		//避免重复加载或者想要重新进行挂载
		if (Reflect.has(require.cache, filePath)) {
			if (force) {
				Reflect.deleteProperty(require.cache, filePath);
			}
		}

		//可能不止一个方法
		const modulesMap = new Map<string, Object>();
		//进行方法加载
		let moduleClass = require.cache?.filePath || require(filePath);
		let keys = Object.keys(moduleClass);
		let fileName = FileUtil.getFileName(filePath);

		keys.forEach(key => {
			let instance = moduleClass[key];

			if (TypeUtil.isFunction(instance)) {
				modulesMap.set(instance.name, instance);
				return;
			}

			if (TypeUtil.isObject(instance)) {
				modulesMap.set(fileName, instance);
			}
		});

		return modulesMap;
	}
}
