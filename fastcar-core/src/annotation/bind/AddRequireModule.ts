import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

/***
 * @version 1.0 依赖模块注入
 *
 */
export default function AddRequireModule(target: Object, m: string, alias: string) {
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
