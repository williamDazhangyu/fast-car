import "reflect-metadata";
import { DesignMeta } from "../../type/DesignMeta";

//数据库列名称
export default function Field(name: string) {
	return function(target: any, propertyKey: string) {
		let fieldMap: Set<string> = Reflect.getMetadata(DesignMeta.fieldMap, target);
		if (!fieldMap) {
			Reflect.defineMetadata(DesignMeta.fieldMap, new Set([propertyKey]), target);
		} else {
			fieldMap.add(propertyKey);
		}
		Reflect.defineMetadata(DesignMeta.field, name, target, propertyKey);
	};
}
