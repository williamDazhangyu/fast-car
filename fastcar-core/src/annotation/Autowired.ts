import { FastCarMetaData } from "../constant/FastCarMetaData";
import Format from "../utils/Format";

const SpecWords = ["Boolean", "Number", "String", "Object"];

/***
 * @version 1.0 依赖模块注入
 *
 */
function addRequireModule(target: any, m: string, alias: string) {
	let relyname = FastCarMetaData.IocModule;
	if (Reflect.hasMetadata(relyname, target)) {
		let iocMap: Map<string, string> = Reflect.getMetadata(relyname, target);
		iocMap.set(m, alias);
	} else {
		let modules: Map<string, string> = new Map();
		modules.set(m, alias);
		Reflect.defineMetadata(relyname, modules, target);
	}
}

/***
 * @version 1.0 说明哪些模块需要被加载
 *
 *
 */
export default function Autowired(target: any, propertyKey: string) {
	//反向找设计类型
	const designType = Reflect.getMetadata("design:type", target, propertyKey);
	let name = designType.name;
	if (!name || SpecWords.includes(name)) {
		name = Format.formatFirstToUp(propertyKey);
	}
	addRequireModule(target, propertyKey, name);
}
