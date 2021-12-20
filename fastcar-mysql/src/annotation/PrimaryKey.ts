import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";

//是否为主键
export default function PrimaryKey(target: any, propertyKey: string) {
	Reflect.defineMetadata(DesignMeta.primaryKey, true, target);
}
