import { FastCarMetaData } from "../constant/FastCarMetaData";
import FormatStr from "./FormatStr";

const SpecWords = ["Boolean", "Number", "String", "Object"];

export default class ReflectUtil {
	static getNameByPropertyKey(target: any, propertyKey: string): string {
		const designType = Reflect.getMetadata(FastCarMetaData.designType, target, propertyKey);
		let key = "";
		let name = "";
		if (designType) {
			name = designType.name;
			key = Reflect.getMetadata(FastCarMetaData.InjectionUniqueKey, designType); //放入至原型中
		}
		//获取不到注入的值时默认为别名的值
		if (!name || SpecWords.includes(name)) {
			key = FormatStr.formatFirstToUp(propertyKey);
		}

		return key;
	}
}
