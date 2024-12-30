import "reflect-metadata";
import { DesignMeta } from "../../db";

//是否为主键
export default function IsSerial(target: any, propertyKey: string) {
	Reflect.defineMetadata(DesignMeta.isSerial, true, target, propertyKey);
}
