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
	let name = "";
	if (designType) {
		name = designType.name;
	}
	if (!name || SpecWords.includes(name)) {
		name = Format.formatFirstToUp(propertyKey);
	}
	AddRequireModule(target, propertyKey, name);
}
