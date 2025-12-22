export default class ClassUtils {
	//获取一个类所有的proto属性 采用递归的形式
	static getProtoType(t: any): (string | symbol)[] {
		if (!t?.prototype) {
			return [];
		}
		let keys: (string | symbol)[] = Reflect.ownKeys(t?.prototype).map((item) => {
			return item;
		});

		let parentObj = Reflect.getPrototypeOf(t);
		if (!parentObj || !Reflect.has(parentObj, "prototype")) {
			return keys;
		}

		let parentKeys = ClassUtils.getProtoType(parentObj);
		let s = new Set([...keys, ...parentKeys]);

		return [...s];
	}

	static getProtoDesc(t: any, key: string | symbol): PropertyDescriptor | null {
		if (!t?.prototype) {
			return null;
		}
		let desc = Object.getOwnPropertyDescriptor(t.prototype, key);
		if (!!desc) {
			return desc;
		}

		let parentObj = Reflect.getPrototypeOf(t);
		if (!parentObj || !Reflect.has(parentObj, "prototype")) {
			return null;
		}

		return ClassUtils.getProtoDesc(parentObj, key);
	}

	//拷贝元数据
	static cloneMetadata(src: any, dst: any): void {
		const keys: any[] = Reflect.getMetadataKeys(src);
		for (const k of keys) {
			const val = Reflect.getMetadata(k, src);
			Reflect.defineMetadata(k, val, dst);
		}
	}
}
