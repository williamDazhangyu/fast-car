import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";

//用于标记数据源位置
export default function DSIndex(target: any, name: string, index: number) {
	Reflect.defineMetadata(DesignMeta.dsIndex, index, target, name);
}
