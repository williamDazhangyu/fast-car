import TypeUtil from "./TypeUtil";
import FileUtil from "./FileUtil";

export default class ClassLoader {
	static loadModule(filePath: string): Map<string, any> | null {
		//校验后缀名是否为js或者ts
		if (!TypeUtil.isTSORJS(filePath)) {
			return null;
		}

		Reflect.deleteProperty(require.cache, filePath);

		//可能不止一个方法
		const modulesMap = new Map<string, Object>();
		//进行方法加载
		let moduleClass = require(filePath);
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
