import { FastCarMetaData } from "../constant/FastCarMetaData";
import Format from "../utils/Format";

//加载依赖模块
function addRequireModule(target: any, m: string) {
	let relyname = FastCarMetaData.IocModule;
	let modules: Set<string> = Reflect.getMetadata(relyname, target) || new Set<String>();
	modules.add(m);

	Reflect.defineMetadata(relyname, modules, target);
}

//说明哪些模块需要被加载
//这边做一个约定 加载的模块为 所需模块的第一个字母小写
export function Autowired(target: any, propertyKey: string) {
	addRequireModule(target, Format.formatFirstToUp(propertyKey));
}
