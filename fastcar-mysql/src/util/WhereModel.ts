import { ValidationUtil } from "fastcar-core/utils";

export default class WhereModel {
	private where: {};

	constructor(where?: { [key: string]: any }, info?: { field?: string[]; excludeField?: string[] }) {
		this.where = {};
		if (ValidationUtil.isNotNull(where) && where) {
			this.addFiled(where, info);
		}
	}

	//过滤空的值
	filterNull(excludeField: string[] = []) {
		let keys = Object.keys(this.where);
		keys.forEach((key) => {
			let value = Reflect.get(this.where, key);
			if (!excludeField.includes(key) && ValidationUtil.isNull(value)) {
				Reflect.deleteProperty(this.where, key);
			}
		});

		return this;
	}

	addFiled(where: { [key: string]: any }, info?: { field?: string[]; excludeField?: string[] }) {
		let { field = [], excludeField = [] } = info || {};
		let all = field.length == 0 && excludeField.length == 0;

		for (let key in where) {
			if (all || (field.length > 0 && field.includes(key)) || (field.length == 0 && !excludeField.includes(key))) {
				let value = where[key];
				//排除基础类型,数组和空对象
				if (ValidationUtil.isNotNull(value) && ValidationUtil.isObject(value) && !ValidationUtil.isArray(value, "array")) {
					let beforeObj = Reflect.get(this.where, key) || {};
					Reflect.set(this.where, key, Object.assign({}, beforeObj, where[key]));
				} else {
					Reflect.set(this.where, key, value);
				}
			}
		}

		return this;
	}

	toObject() {
		return this.where;
	}
}
