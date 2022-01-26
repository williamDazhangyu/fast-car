import { FastCarMetaData } from "../constant/FastCarMetaData";
import Format from "../utils/Format";
import AddRequireModule from "./AddRequireModule";

const SpecWords = ["Boolean", "Number", "String", "Object"];

/***
 * @version 1.0 说明哪些模块需要被加载
 *
 *
 */
export default function Autowired(target: any, propertyKey: string) {
	//反向找设计类型
	const designType = Reflect.getMetadata(FastCarMetaData.designType, target, propertyKey);
	let key = "";
	let name = "";

	if (designType) {
		name = designType.name;
		key = Reflect.getMetadata(FastCarMetaData.InjectionUniqueKey, designType); //放入至原型中
	}

	//获取不到注入的值时默认为别名的值
	if (!name || SpecWords.includes(name)) {
		key = Format.formatFirstToUp(propertyKey);
	}

	AddRequireModule(target, propertyKey, key);
}
