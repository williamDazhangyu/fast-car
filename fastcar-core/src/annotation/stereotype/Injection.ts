import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";
import { id } from "../../utils/Id";

export default function Injection(target: any, name: string) {
	//生成别名 避免名称重复的情况
	let key = `${name}:${id()}`;
	Reflect.defineMetadata(name, true, target.prototype);
	Reflect.defineMetadata(FastCarMetaData.InjectionUniqueKey, key, target); //放入至原型中
}
