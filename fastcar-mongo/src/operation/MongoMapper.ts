import "reflect-metadata";
import { Autowired, DSIndex } from "@fastcar/core/annotation";
import { DBMapper, SqlDelete, SqlQuery, SqlUpdate, SqlWhere, MapperType, DesignMeta, JoinEnum, OperatorEnum, OrderType, OrderEnum } from "@fastcar/core/db";
import MongoDataSourceManager from "../dataSource/MongoDataSourceManager";
import { BaseMapper } from "@fastcar/core/db";
import { RowData } from "@fastcar/core/db";
import { ObjectId } from "mongodb";
import { OperationSet } from "../type/SqlExecType";
import { TypeUtil, ValidationUtil } from "@fastcar/core/utils";
import { OperatorEnumMapping } from "../type/OperatorEnumMapping";

class MongoMapper<T extends Object> extends BaseMapper<T> {
	@Autowired
	protected dsm!: MongoDataSourceManager;

	protected primaryKey: string;

	constructor() {
		super();

		this.primaryKey = "_id";
		this.mappingList.some((item) => {
			if (item.primaryKey) {
				this.primaryKey = item.name;
				return true;
			}

			return false;
		});
	}

	protected covertEntity(row: T): RowData {
		let data: RowData = {};
		this.mappingList.forEach((item) => {
			let value = Reflect.get(row, item.name);
			if (ValidationUtil.isNotNull(value)) {
				if (item.primaryKey) {
					Reflect.set(data, "_id", new ObjectId(value));
					return;
				}

				Reflect.set(data, item.field, value);
			}
		});

		return data;
	}

	//获取数据库别名通过代码内的名称
	protected getFieldName(name: string): string {
		if (this.primaryKey == name) {
			return "_id";
		}

		let info = this.mappingMap.get(name);
		return info ? info.field : name;
	}

	//转换操作符名称
	protected covertOperation(key: string): string {
		return Reflect.get(OperatorEnumMapping, key) || key;
	}

	//转换字段名称
	protected analysisFields(fields?: string[]): RowData | null {
		if (!fields || fields.length == 0) {
			return null;
		}

		let d: any = {};
		fields.forEach((item) => {
			let alias = this.getFieldName(item);
			Reflect.set(d, alias, 1);
		});

		return { $project: d };
	}

	protected analysisCondition(where: SqlWhere = {}, joinKey: string = "AND"): RowData {
		let keys = Object.keys(where);
		let list: RowData[] = [];

		if (keys.length == 0) {
			return {};
		}

		for (let key of keys) {
			let value: any = where[key];

			if (JoinEnum.and == key || JoinEnum.or == key) {
				//递归调用计算
				let childResult = this.analysisCondition(value, key);
				list.push(childResult);
			} else {
				let ov = {};

				//对缺省类型进行补充
				if (TypeUtil.isArray(value)) {
					//数组类型
					Reflect.set(ov, OperatorEnum.in, value);
				} else if (ValidationUtil.isNull(value)) {
					//空值类型
					Reflect.set(ov, OperatorEnum.isNUll, value);
				} else if (!TypeUtil.isObject(value) || Object.keys(ov).length == 0) {
					//基本类型
					Reflect.set(ov, OperatorEnum.eq, value);
				} else {
					ov = value;
				}

				//聚合类型
				let alias = this.getFieldName(key);
				let tmpv = {};

				Object.keys(ov).forEach((operatorKeys) => {
					let operatorValue = Reflect.get(ov, operatorKeys);

					if (key == this.primaryKey || key == "_id") {
						operatorValue = new ObjectId(operatorValue);
					}

					switch (operatorKeys) {
						case OperatorEnum.isNUll: {
							Reflect.set(tmpv, "$eq", null);
							break;
						}
						case OperatorEnum.isNotNull: {
							Reflect.set(tmpv, "$ne", null);
							break;
						}
						default: {
							let tv = this.covertOperation(operatorKeys);
							Reflect.set(tmpv, tv, operatorValue);
							break;
						}
					}
				});

				let cv = {};
				Reflect.set(cv, alias, tmpv);
				list.push(cv);
			}
		}

		if (joinKey == "AND") {
			let obj = {};
			list.forEach((item) => {
				let keys = Object.keys(item);
				let firstKey = keys[0];
				Reflect.set(obj, firstKey, item[firstKey]);
			});
			return obj;
		} else {
			return { $or: list as any };
		}
	}

	protected analysisWhere(where: SqlWhere = {}, joinKey: string = "AND"): RowData {
		let finalResult = this.analysisCondition(where, joinKey);
		if (finalResult) {
			return finalResult;
		}

		return {};
	}

	protected analysisGroups(groups: string[] = []): RowData | null {
		if (groups.length > 0) {
			let ids: any = {};
			groups.forEach((i) => {
				let key = i.toString();
				let alias = this.getFieldName(key);
				Reflect.set(ids, key, `$${alias}`);
			});

			return { $group: { _id: ids } as any };
		}

		return null;
	}

	protected analysisOrders(orders: OrderType = {}): RowData | null {
		let keys = Object.keys(orders);

		if (keys.length > 0) {
			let o: any = {};
			keys.forEach((i) => {
				let key = i.toString();
				let alias = this.getFieldName(key);
				let v = orders[key].toUpperCase();

				Reflect.set(o, alias, v == OrderEnum.asc ? 1 : -1);
			});

			return { $sort: o };
		}

		return null;
	}

	protected analysisLimit(limit?: number, offest?: number): RowData | null {
		let filters = {};

		if (!ValidationUtil.isNumber(limit)) {
			return null;
		}

		Reflect.set(filters, "$limit", limit);

		if (ValidationUtil.isNumber(offest)) {
			Reflect.set(filters, "$skip", offest);
		}

		return filters;
	}

	protected analysisRow(row: RowData): RowData | null {
		let o = {};

		Object.keys(row).forEach((key) => {
			let alias = this.getFieldName(key);
			let v = Reflect.get(row, key);

			let originName = this.dbFields.get(alias);
			if (originName) {
				let desc = this.mappingMap.get(originName);

				if (desc) {
					if (desc.primaryKey) {
						return;
					}
				}
			}

			Reflect.set(o, alias, v);
			return;
		});

		return Object.keys(o).length == 0 ? null : o;
	}

	async exec(opts: OperationSet[], ds?: string): Promise<any> {
		let list = [{ method: "collection", args: [this.tableName] }];

		return await this.dsm.execute({
			ds,
			params: [...list, ...opts],
		});
	}

	async saveORUpdate(rows: T | T[], @DSIndex ds?: string): Promise<number> {
		//分为含有主键和不含有主键的两大类
		if (!Array.isArray(rows)) {
			rows = [rows];
		}

		let saveRows: T[] = [];
		let updateRows: T[] = [];

		rows.forEach((row) => {
			if (Reflect.has(row, this.primaryKey)) {
				updateRows.push(row);
			} else {
				saveRows.push(row);
			}
		});

		if (saveRows.length > 0) {
			await this.saveList(saveRows, ds);
		}

		if (updateRows.length > 0) {
			for (let u of updateRows) {
				await this.updateByPrimaryKey(u, ds);
			}
		}

		return rows.length;
	}

	async saveOne(row: T, @DSIndex ds?: string): Promise<string> {
		let data = this.covertEntity(row);
		let result = await this.exec([{ method: "insertOne", args: [data] }], ds);

		let id = result.insertedId.toString();

		Reflect.set(row, this.primaryKey, id);
		return id;
	}

	async saveList(rows: T[], @DSIndex ds?: string): Promise<boolean> {
		if (rows.length < 1) {
			return Promise.reject(new Error("rows is empty"));
		}

		let dataList: RowData[] = [];
		for (let row of rows) {
			dataList.push(this.covertEntity(row));
		}

		let result = await this.exec([{ method: "insertMany", args: [dataList] }], ds);
		return result.insertedCount >= rows.length;
	}

	async update({ row, where }: SqlUpdate, @DSIndex ds?: string): Promise<boolean> {
		let rowStr = this.analysisRow(row);
		if (!rowStr) {
			return Promise.reject(new Error("row is empty"));
		}

		let whereC = this.analysisWhere(where);

		let result = await this.exec([{ method: "updateMany", args: [whereC, { $set: rowStr }] }], ds);

		return result.modifiedCount > 0;
	}

	async updateOne({ row, where }: SqlUpdate, @DSIndex ds?: string): Promise<boolean> {
		let rowStr = this.analysisRow(row);
		if (!rowStr) {
			return Promise.reject(new Error("row is empty"));
		}

		let whereC = this.analysisWhere(where);

		let result = await this.exec([{ method: "updateOne", args: [whereC, { $set: rowStr }] }], ds);

		return result.modifiedCount > 0;
	}

	async updateByPrimaryKey(row: T, @DSIndex ds?: string): Promise<boolean> {
		let dbRow = this.covertEntity(row);

		let _id = Reflect.get(dbRow, "_id");
		if (!_id) {
			return Promise.reject(new Error("_id is empty"));
		}

		return await this.updateOne({ row: dbRow, where: { _id } }, ds);
	}

	async select(conditions: SqlQuery, @DSIndex ds?: string): Promise<T[]> {
		let searchArray = [];

		let fields = this.analysisFields(conditions.fields);
		if (fields) {
			searchArray.push(fields);
		}

		let whereC = this.analysisWhere(conditions.where);
		if (Object.keys(whereC).length > 0) {
			searchArray.push({ $match: whereC });
		}

		let groupStr = this.analysisGroups(conditions.groups);
		if (groupStr) {
			searchArray.push(groupStr);
		}

		let orderStr = this.analysisOrders(conditions.orders);
		if (groupStr) {
			searchArray.push(orderStr);
		}

		let limitStr = this.analysisLimit(conditions?.limit, conditions?.offest);
		if (limitStr) {
			searchArray.push(limitStr);
		}

		let rows = await this.exec(
			[
				{ method: "aggregate", args: [searchArray] },
				{ method: "toArray", args: [] },
			],
			ds
		);

		if (!Array.isArray(rows)) {
			return [];
		}

		return this.setRows(rows);
	}

	/***
	 * @version 1.0 查询单个对象
	 *
	 */
	async selectOne(conditions?: SqlQuery, @DSIndex ds?: string): Promise<T | null> {
		let queryInfo = Object.assign({}, conditions, { limit: 1 });

		let res = await this.select(queryInfo, ds);
		let o = res.length > 0 ? res[0] : null;

		return o;
	}

	/***
	 * @version 1.0 通过主键查找对象
	 *
	 */
	async selectByPrimaryKey(row: T, @DSIndex ds?: string): Promise<T | null> {
		let id = Reflect.get(row, this.primaryKey);

		if (!id) {
			return Promise.reject(new Error(`${this.tableName} primary key  is null`));
		}

		let sqlQuery: SqlQuery = {
			where: {
				_id: id,
			}, //查询条件
		};

		return await this.selectOne(sqlQuery, ds);
	}

	async exist(where: SqlWhere, @DSIndex ds?: string): Promise<boolean> {
		let whereC = this.analysisWhere(where);
		let limitStr = this.analysisLimit(1);

		let rows = await this.exec(
			[
				{ method: "aggregate", args: [[{ $match: whereC }, limitStr]] },
				{ method: "toArray", args: [] },
			],
			ds
		);

		return rows.length > 0;
	}

	async count(where: SqlWhere, @DSIndex ds?: string): Promise<number> {
		let whereC = this.analysisWhere(where);

		let countC = { $group: { _id: null, count: { $sum: 1 } } };

		let res: any[] = await this.exec(
			[
				{ method: "aggregate", args: [[{ $match: whereC }, countC]] },
				{ method: "toArray", args: [] },
			],
			ds
		);

		if (res.length == 0) {
			return 0;
		}

		return res[0].count;
	}

	async delete(where: SqlWhere, @DSIndex ds?: string): Promise<boolean> {
		let wherec = this.analysisWhere(where);
		let res = await this.exec([{ method: "deleteMany", args: [wherec] }], ds);

		return res.deletedCount > 0;
	}

	async deleteOne(where: SqlWhere, @DSIndex ds?: string): Promise<boolean> {
		let wherec = this.analysisWhere(where);
		let res = await this.exec([{ method: "deleteOne", args: [wherec] }], ds);

		return res.deletedCount > 0;
	}

	async deleteByPrimaryKey(row: T, @DSIndex ds?: string): Promise<boolean> {
		let id = Reflect.get(row, this.primaryKey);

		return await this.deleteOne({ _id: id }, ds);
	}
}

export default MongoMapper;
