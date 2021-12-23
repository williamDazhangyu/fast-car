import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";
import { MapperType } from "../type/MapperType";

//表名称 不缺省
export default function Table(name: string) {
	return function (target: any) {
		const proto = target.prototype;
		let fields: Set<string> = Reflect.getOwnMetadata(DesignMeta.fieldMap, proto);
		let mappingMap = new Map<string, MapperType>();
		let dbFields = new Map<string, string>();

		fields.forEach((c) => {
			let tsType = Reflect.getOwnMetadata(DesignMeta.designType, proto, c);
			let field = Reflect.getOwnMetadata(DesignMeta.field, proto, c) || c;
			let dbType = Reflect.getOwnMetadata(DesignMeta.dbType, proto, c) || "varchar";
			let maxLength = Reflect.getOwnMetadata(DesignMeta.maxLength, proto, c) || 0;
			let notNull = !!Reflect.getOwnMetadata(DesignMeta.notNull, proto, c);
			let primaryKey = !!Reflect.getOwnMetadata(DesignMeta.primaryKey, proto, c);

			let tsName: string = tsType.name;

			const m: MapperType = {
				name: c, //变量名称
				tsType: tsName.toLowerCase(), //ts类型
				field, //数据库列名
				dbType: dbType, //数据类型
				maxLength: maxLength, //最大长度 当为字符串或者整型时传递
				notNull, //是否为空 默认为空
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
