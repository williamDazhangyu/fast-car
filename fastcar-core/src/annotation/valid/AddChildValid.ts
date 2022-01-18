import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";
import { FormRuleModel } from "../../model/FormRuleModel";
import TypeUtil from "../../utils/TypeUtil";

//添加子元素的校验规则
export default function AddChildValid(target: any, name: string, value: { [key: string]: any }) {
	let childMap: Map<string, FormRuleModel> = Reflect.getMetadata(FastCarMetaData.ValidChildFormRules, target);
	if (!childMap) {
		childMap = new Map();
	}
	let item = childMap.get(name);
	if (!item) {
		let proto = Reflect.getMetadata(FastCarMetaData.designType, target, name);
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
			value["filters"] = [...item.filters, ...value.filters];
		}
	}

	//合并所有属性
	Object.assign(item, value);
	childMap.set(name, item);
}
