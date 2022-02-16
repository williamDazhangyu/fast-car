import { DBMapper, MapperType, SqlDelete, SqlQuery, SqlUpdate, SqlWhere } from "../db";
import { DesignMeta } from "../type/DesignMeta";
import DataFormat from "../utils/DataFormat";

export default class BaseMapper<T> implements DBMapper<T> {
	protected tableName: string;
	protected classZ: any; //映射的原型类
	protected mappingMap: Map<string, MapperType>; //代码别名-映射关系
	protected mappingList: MapperType[];
	protected dbFields: Map<string, string>; //数据库别名-代码别名

	/***
	 * @version 1.0 对于类型做一个转换
	 */
	constructor() {
		let tClass = Reflect.getMetadata(DesignMeta.entity, this);
		this.classZ = tClass;

		let tableName = Reflect.getMetadata(DesignMeta.table, tClass);
		if (!tableName) {
			throw new Error(`This class ${tClass.name} has no annotation table name`);
		}
		this.tableName = tableName;
		this.mappingMap = Reflect.getMetadata(DesignMeta.mapping, tClass); //映射关系
		this.dbFields = Reflect.getMetadata(DesignMeta.dbFields, tClass); //作用的列名
		this.mappingList = Array.of();

		this.mappingMap.forEach(item => {
			this.mappingList.push(item);
		});
	}

	//获取数据库别名通过代码内的名称
	protected getFieldName(name: string): string {
		let info = this.mappingMap.get(name);
		return info ? info.field : name;
	}

	protected setRow(rowData: Object): T {
		let t = new this.classZ();

		this.mappingMap.forEach((item, key) => {
			let value = Reflect.get(rowData, item.field) || Reflect.get(rowData, key);
			if (value != null) {
				let fvalue = DataFormat.formatValue(value, item.type);
				Reflect.set(t, key, fvalue);
			}
		});

		return t;
	}

	protected setRows(rowDataList: Object[]): T[] {
		let list: T[] = Array.of();
		rowDataList.forEach(item => {
			list.push(this.setRow(item));
		});

		return list;
	}

	saveORUpdate(rows: T | T[], ds?: string, sessionId?: string): Promise<string | number> {
		throw new Error("Method not implemented.");
	}
	saveOne(row: T, ds?: string, sessionId?: string): Promise<string | number> {
		throw new Error("Method not implemented.");
	}
	saveList(rows: T[], ds?: string, sessionId?: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	update({ row, where, limit }: SqlUpdate, ds?: string, sessionId?: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	updateOne(sqlUpdate: SqlUpdate, ds?: string, sessionId?: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	updateByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	select(conditions: SqlQuery, ds?: string, sessionId?: string): Promise<T[]> {
		throw new Error("Method not implemented.");
	}

	/***
	 * @version 1.0 查询单个对象
	 *
	 */
	async selectOne(conditions?: SqlQuery, ds?: string, sessionId?: string): Promise<T | null> {
		throw new Error("Method not implemented.");
	}

	/***
	 * @version 1.0 通过主键查找对象
	 *
	 */
	async selectByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<T | null> {
		throw new Error("Method not implemented.");
	}

	exist(where: SqlWhere, ds?: string, sessionId?: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	count(where: SqlWhere, ds?: string, sessionId?: string): Promise<number> {
		throw new Error("Method not implemented.");
	}
	delete(conditions: SqlDelete, ds?: string, sessionId?: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	deleteOne(where: SqlWhere, ds?: string, sessionId?: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	deleteByPrimaryKey(row: T, ds?: string, sessionId?: string): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
}
