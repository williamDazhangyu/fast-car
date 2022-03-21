import { FastCarMetaData } from "../../constant/FastCarMetaData";
import Logger from "../../interface/Logger";

//日志实例
export default function Log(category?: string) {
	return function(target: any, propertyKey: string) {
		const designType = Reflect.getMetadata(FastCarMetaData.designType, target, propertyKey);
		if (designType != Logger) {
			console.error(`${propertyKey} does not belong to Logger type`);
			return;
		}

		let m = category || propertyKey;
		if (Reflect.hasMetadata(FastCarMetaData.LoggerModule, target)) {
			let loggerMap: Map<string, string> = Reflect.getMetadata(FastCarMetaData.LoggerModule, target);
			loggerMap.set(propertyKey, m);
		} else {
			let modules: Map<string, string> = new Map();
			modules.set(propertyKey, m);
			Reflect.defineMetadata(FastCarMetaData.LoggerModule, modules, target);
		}
	};
}
