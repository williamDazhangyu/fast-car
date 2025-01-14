export type FIELDTYPE = {
	field: string;
	order?: boolean; //是否为倒序 order true为倒序
	compare?: (a: any, b: any) => -1 | 0 | 1; // -1 0 1 //-1为小 0为相等  1为大
};

export default class DataMap<K, V extends Object> extends Map<K, V> {
	constructor() {
		super();
	}

	init(list: Array<V>, key: string) {
		this.clear();
		list.forEach((item) => {
			this.set(Reflect.get(item, key) as K, item);
		});
	}

	toValues(): V[] {
		return [...this.values()];
	}

	toKeys(): K[] {
		return [...this.keys()];
	}

	toObject(): { [key: string]: V } {
		let o = {};
		this.forEach((v, k: any) => {
			Reflect.set(o, k, v);
		});

		return o;
	}

	//自定义排序 支持多个排序
	sort(sorts?: FIELDTYPE[], list?: V[]): V[] {
		list = !list ? this.toValues() : list;
		if (!sorts || sorts?.length == 0) {
			return list;
		}

		list.sort((a, b) => {
			let resultNum = 0;
			sorts.some((f, index) => {
				let cindex = index + 1;
				let field = f.field;
				let aValue = Reflect.get(a, field);
				let bValue = Reflect.get(b, field);

				if (f.compare) {
					let flag = f.compare(aValue, bValue);
					if (flag == 0) {
						return false;
					}
					resultNum = flag > 0 ? cindex : -cindex;
				} else {
					if (aValue == bValue) {
						return false;
					}

					resultNum = aValue > bValue ? cindex : -cindex;
				}

				//降序则倒着
				if (f.order) {
					resultNum = -resultNum;
				}

				return true;
			});
			return resultNum;
		});
		return list;
	}

	/***
	 * @version 1.0 查找属性名称
	 * @params atts代表属性键值对匹配
	 *
	 */
	findByAtts(atts: { [key: string]: any }): V[] {
		let list: V[] = [];
		let keys = Object.keys(atts);

		this.forEach((item) => {
			let flag = keys.every((key) => {
				let v = Reflect.get(atts, key);

				//这边判断 是不是一个复合属性
				if (Reflect.has(item, key)) {
					let itemV = Reflect.get(item, key);
					return Array.isArray(v) ? v.includes(itemV) : itemV == v;
				} else {
					let keyList = key.split(".");
					if (keyList.length > 1) {
						let tmpV: any = item;
						let f = keyList.every((tk) => {
							if (!Reflect.has(tmpV, tk)) {
								return false;
							}
							tmpV = Reflect.get(tmpV, tk);
							return true;
						});

						if (!f) {
							return false;
						}

						return Array.isArray(v) ? v.includes(tmpV) : tmpV == v;
					}
				}

				return false;
			});
			if (flag) {
				list.push(item);
			}
		});

		return list;
	}
}
