import { DesignMeta } from "../../type/DesignMeta";

//是否为非空字段
export default function NotNull(target: any, propertyKey: string) {
	Reflect.defineMetadata(DesignMeta.notNull, true, target, propertyKey);
}
