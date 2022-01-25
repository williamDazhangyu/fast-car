import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";
import { FormRuleModel, FormRuleType } from "../../model/FormRuleModel";
import TypeUtil from "../../utils/TypeUtil";

export function Rule(rules: { [prop: string]: FormRuleModel } = {}) {
	return function(target: any, method: string, index: number) {
		//获取设计类型
		//获取增强类型的增加严格校验
		let paramsTypes = Reflect.getMetadata(FastCarMetaData.paramTypes, target, method);

		//对rules进行进一步的补充
		let designObj = paramsTypes[index];
		let basicFlag = false;
		if (!designObj) {
			console.warn(`Design type not found by ${method} in ${index}`);
		} else {
			basicFlag = TypeUtil.isBasic(designObj.name);
			//获取表单类型
			let childMap: Map<string, FormRuleModel> = Reflect.getMetadata(FastCarMetaData.ValidChildFormRules, target, `${method}-${index}`);

			//进行合并添加
			if (TypeUtil.isClass(designObj)) {
				let appendMap: Map<string, FormRuleModel> = Reflect.getMetadata(FastCarMetaData.ValidChildFormRules, designObj.prototype);
				if (appendMap) {
					if (!childMap) {
						childMap = new Map();
					}
					appendMap.forEach((v, key) => {
						if (!childMap.has(key)) {
							childMap.set(key, v);
							return;
						} else {
							//进行覆盖更新
							let item = childMap.get(key);
							if (Reflect.has(v, "filters")) {
								if (Array.isArray(item?.filters)) {
									v.filters?.forEach(f => {
										item?.filters?.push(f);
									});
								}
							}

							//合并所有属性
							item = Object.assign(v, item);
							childMap.set(key, item);
						}
					});
				}
			}
			if (childMap && childMap.size > 0) {
				//补充表单
				childMap.forEach((citem, prop) => {
					if (Reflect.has(rules, prop)) {
						//优先取表单里的
						rules[prop] = Object.assign(citem, rules[prop]);
					} else {
						Reflect.set(rules, prop, citem);
					}
				});
			}
		}

		let rulesMap: Map<number, FormRuleType> = Reflect.getMetadata(FastCarMetaData.ValidFormRules, target, method);
		if (!rulesMap) {
			rulesMap = new Map<number, FormRuleType>();
			Reflect.defineMetadata(FastCarMetaData.ValidFormRules, rulesMap, target, method);
		}

		//补全消息
		Object.keys(rules).forEach(prop => {
			let r = rules[prop];
			if (r.message) {
				if (r.required) {
					r.nullMessage = r.nullMessage ? r.nullMessage : r.message;
				}

				if (r.maxSize || r.minSize) {
					r.sizeMessgae = r.sizeMessgae ? r.sizeMessgae : r.message;
				}

				r.typeMessage = r.typeMessage ? r.typeMessage : r.message;
			} else {
				if (r.required) {
					r.nullMessage = `${prop} is required`;
				}

				r.typeMessage = `${prop} type is ${r.type}`;
			}

			if (basicFlag && !Reflect.has(r, "type")) {
				if (designObj) {
					r.type = designObj.name.toLowerCase();
				}
			}
		});

		rulesMap.set(index, { rules, basicFlag, index });
	};
}
