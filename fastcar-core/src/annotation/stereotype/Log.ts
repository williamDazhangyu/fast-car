import { FastCarMetaData } from "../../constant/FastCarMetaData";

//日志实例
export default function Log(category?: string) {
	return function (target: any, propertyKey: string) {
		let m = category || propertyKey;

		let services: Array<{
			propertyKey: string;
			name: string;
		}> = Reflect.getMetadata(FastCarMetaData.InjectionLog, target);
		if (!services) {
			services = [];
			Reflect.defineMetadata(FastCarMetaData.InjectionLog, services, target);
		}

		services.push({
			propertyKey,
			name: m,
		});
	};
}
