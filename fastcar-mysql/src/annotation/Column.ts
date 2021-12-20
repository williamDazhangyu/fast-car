import { DesignMeta } from "../type/DesignMeta";

//数据库列名称
export default function Column(name: string) {
	return function (target: any, propertyKey: string) {
		Reflect.defineMetadata(DesignMeta.column, name, target);
	};
}
