import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";

//动态数据源获取 根据就近原则 传入参数-函数-类名
export default function DS(name: string) {
	return function (target: any, methodName?: string, descriptor?: PropertyDescriptor) {
		if (methodName && descriptor) {
			Reflect.defineMetadata(DesignMeta.ds, name, target, methodName);
		} else {
			Reflect.defineMetadata(DesignMeta.ds, name, target.prototype);
		}
	};
}
