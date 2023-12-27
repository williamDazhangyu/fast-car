import "reflect-metadata";
import { FastCarMetaData } from "../../constant/FastCarMetaData";
import { DesignMeta } from "../../type/DesignMeta";
import { MapperType } from "../../type/MapperType";

//表名称 不缺省
export default function Table(name: string) {
	return function (target: any) {
		const proto = target.prototype;
		let fields: Set<string> = Reflect.getOwnMetadata(DesignMeta.fieldMap, proto);
		let mappingMap = new Map<string, MapperType>();
		let dbFields = new Map<string, string>();

		fields.forEach((c) => {
			let tsType = Reflect.getOwnMetadata(FastCarMetaData.designType, proto, c);
			let field = Reflect.getOwnMetadata(DesignMeta.field, proto, c) || c;
			let dbType = Reflect.getOwnMetadata(DesignMeta.dbType, proto, c) || "varchar";
			let primaryKey = !!Reflect.getOwnMetadata(DesignMeta.primaryKey, proto, c);

			let tsName: string = tsType.name;
			let customeType = Reflect.getOwnMetadata(FastCarMetaData.CustomType, proto, c);

			const m: MapperType = {
				name: c, //变量名称
				type: customeType || tsName.toLowerCase(), //ts类型
				field, //数据库列名
				dbType: dbType, //数据类型
				primaryKey, //是否为主键 默认为false
			};
			dbFields.set(field, c);
			mappingMap.set(c, m);
		});

		Reflect.defineMetadata(DesignMeta.dbFields, dbFields, target); //作用的列名
		Reflect.defineMetadata(DesignMeta.mapping, mappingMap, target); //映射关系
		Reflect.defineMetadata(DesignMeta.table, name, target); //注入表名
	};
}
