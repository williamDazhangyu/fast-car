import { DesignMeta } from "../type/DesignMeta";

//是否为非空字段
export default function NotNULL(target: any, propertyKey: string) {
	Reflect.defineMetadata(DesignMeta.notNULL, true, target);
}
