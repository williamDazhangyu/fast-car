import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

//自定义类型
export default function CustomType(name: string) {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata(FastCarMetaData.CustomType, name, target, propertyKey);
	};
}
