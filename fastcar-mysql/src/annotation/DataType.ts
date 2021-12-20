import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";

//字段名称 如果没有则为统一
export default function DataType(name: string) {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata(DesignMeta.dataType, name, target);
	};
}
