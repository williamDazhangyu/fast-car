import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";

//表名称 不缺省
export default function Table(name: string) {
	return function (target: any) {
		Reflect.defineMetadata(DesignMeta.table, name, target);
	};
}
