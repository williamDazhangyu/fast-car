type FIELDTYPE = {
	field: string;
	order?: boolean; //是否为倒序 order true为倒序
	compare?: Function;
};

export default class DataMap<K, V extends Object> extends Map {
	constructor() {
		super();
	}

	toValues(): V[] {
		return [...this.values()];
	}

	toKeys(): K[] {
		return [...this.keys()];
	}

	//自定义排序 支持多个排序
	sort(sorts?: FIELDTYPE[], list?: V[]): V[] {
		list = !list ? this.toValues() : list;

		if (!sorts || sorts?.length == 0) {
			return list;
		}

		let total = sorts.length;
		list.sort((a, b) => {
			let resultNum = 0;
			sorts.some((f, index) => {
				let field = f.field;

				let aValue = Reflect.get(a, field);
				let bValue = Reflect.get(b, field);

				let flag = !!f.compare ? f.compare(aValue, aValue) : aValue > bValue;
				if (!!flag) {
					resultNum = total - index;
					//降序则倒着
					if (f.order) {
						resultNum = -resultNum;
					}
					return true;
				}

				return false;
			});

			return resultNum;
		});

		return list;
	}

	//查找属性名称
	findByAtt() {}
}

let a = new DataMap<number, string>();
