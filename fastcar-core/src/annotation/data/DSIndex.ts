import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

//用于标记数据源位置
export default function DSIndex(target: any, name: string, index: number) {
	Reflect.defineMetadata(FastCarMetaData.DSIndex, index, target, name);
}
