import "reflect-metadata";
import CryptoUtil from "../../utils/CryptoUtil";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

export default function Injection(target: any, name: string) {
	//生成别名 避免名称重复的情况
	let key = `${name}:${CryptoUtil.getHashStr()}`;
	Reflect.defineMetadata(name, true, target.prototype);
	Reflect.defineMetadata(FastCarMetaData.InjectionUniqueKey, key, target); //放入至原型中
}
