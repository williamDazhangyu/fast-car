import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";
import { FormRuleModel } from "../../model/FormRuleModel";
import TypeUtil from "../../utils/TypeUtil";
import ValidationUtil from "../../utils/ValidationUtil";

//添加子元素的校验规则
export default function AddChildValid(target: any, name: string, value: { [key: string]: any }, index?: number) {
	let childMap: Map<string, FormRuleModel>;

	let paramsFlag = ValidationUtil.isNumber(index);
	let alias = paramsFlag ? `${name}-${index}` : name;
	if (paramsFlag) {
		childMap = Reflect.getMetadata(FastCarMetaData.ValidChildFormRules, target, alias);
		if (!childMap) {
			childMap = new Map();
			Reflect.defineMetadata(FastCarMetaData.ValidChildFormRules, childMap, target, alias);
		}
	} else {
		childMap = Reflect.getMetadata(FastCarMetaData.ValidChildFormRules, target);
		if (!childMap) {
			childMap = new Map();
			Reflect.defineMetadata(FastCarMetaData.ValidChildFormRules, childMap, target);
		}
	}

	let item = childMap.get(alias);
	if (!item) {
		let proto = Reflect.getMetadata(FastCarMetaData.designType, target, name);

		if (paramsFlag) {
			//修改为方法获取原型
			let paramsTypes = Reflect.getMetadata(FastCarMetaData.paramTypes, target, name);
			if (typeof index == "number") {
				proto = paramsTypes[index];
			}
		}

		let typeName = proto.name.toLowerCase();
		if (!TypeUtil.isBasic(typeName)) {
			typeName = typeName == "array" ? "array" : "object";
		}

		item = {
			type: typeName,
		};
	}

	//自定义方法合并
	if (Reflect.has(value, "filters")) {
		if (Array.isArray(item.filters)) {
			item.filters.forEach((f) => {
				value.filters.push(f);
			});
		}
	}

	//合并所有属性
	Object.assign(item, value);
	childMap.set(alias, item);
}
