import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";
import { Autowired, DSIndex } from "fastcar-core/annotation";
import MysqlDataSourceManager from "../dataSource/MysqlDataSourceManager";
import { JoinKeys, OrderType, RowData, RowType, SqlDelete, SqlQuery, SqlUpdate, SqlWhere } from "./OperationType";
import { MapperType } from "../type/MapperType";
import { OperatorEnum } from "./OperationType";
import { DataFormat, TypeUtil, ValidationUtil } from "fastcar-core/utils";
import SerializeUtil from "../util/SerializeUtil";
import SqlSession from "../annotation/SqlSession";

/****
 * @version 1.0 采用crud方式进行数据操作
 */
class MysqlMapper<T extends Object> {
	protected tableName: string;
	protected classZ: any; //映射的原型类
	protected mappingMap: Map<string, MapperType>; //代码别名-映射关系
	protected mappingList: MapperType[];
	protected dbFields: Map<string, string>; //数据库别名-代码别名

	@Autowired
	protected dsm!: MysqlDataSourceManager;

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

		this.mappingMap.forEach((item) => {
			this.mappingList.push(item);
		});
	}

	//获取数据库别名通过代码内的名称
	protected getFieldName(name: string): string {
		let info = this.mappingMap.get(name);
		return info ? info.field : name;
	}

	//自动映射数据库字段
	protected toDBValue(v: any, key: string, type: string): any {
		let value = Reflect.get(v, key);
		let tmpValue = SerializeUtil.serialize(value, type);

		return tmpValue;
	}

	//分析选定字段
	protected analysisFields(fields: string[] = []): string {
		if (fields.length == 0) {
			return "*";
		}

		let list = fields.map((item) => {
			return this.getFieldName(item);
		});
		return list.join(",");
	}

	//解析条件
	protected analysisWhere(where: SqlWhere = {}, joinKey: string = "AND", params: any[] = []): RowType {
		let finalResult = this.analysisCondition(where, joinKey, params);
		if (finalResult.sql) {
			finalResult.sql = "WHERE " + finalResult.sql;
			return finalResult;
		}

		return finalResult;
	}

	//解析条件
	protected analysisCondition(where: SqlWhere = {}, joinKey: string = "AND", params: any[] = []): RowType {
		let keys = Object.keys(where);
		let list: string[] = Array.of();

		if (keys.length == 0) {
			return {
				sql: "",
				args: [],
			};
		}

		for (let key of keys) {
			let value: any = where[key];

			if (JoinKeys.includes(key)) {
				//递归调用计算
				let childResult = this.analysisCondition(value, key);
				list.push(childResult.sql);
				params = [...params, ...childResult.args];
			} else {
				let ov = {};

				//对缺省类型进行补充
				if (TypeUtil.isArray(value)) {
					//数组类型
					Reflect.set(ov, OperatorEnum.in, value);
				} else if (ValidationUtil.isNull(value)) {
					//空值类型
					Reflect.set(ov, OperatorEnum.isNUll, value);
				} else if (!TypeUtil.isObject(value)) {
					//基本类型
					Reflect.set(ov, OperatorEnum.eq, value);
				} else {
					ov = value;
				}

				//聚合类型
				let clist: string[] = Array.of();
				let alias = this.getFieldName(key);

				Object.keys(ov).forEach((operatorKeys) => {
					let operatorValue = Reflect.get(ov, operatorKeys);

					switch (operatorKeys) {
						case OperatorEnum.isNUll: {
							clist.push(`ISNULL(${alias})`);
							break;
						}
						case OperatorEnum.isNotNull: {
							clist.push(`${alias} IS NOT NULL`);
							break;
						}
						case OperatorEnum.in: {
							clist.push(`${alias} IN (?)`);
							params.push(operatorValue);
							break;
						}
						default: {
							clist.push(`${alias} ${operatorKeys} ?`);
							params.push(operatorValue);
							break;
						}
					}
				});

				if (clist.length == 1) {
					list.push(clist[0]);
				} else {
					list.push(`( ${clist.join(` AND `)})`);
				}
			}
		}

		if (list.length == 1) {
			return {
				sql: list[0],
				args: params,
			};
		}

		return {
			sql: `(${list.join(` ${joinKey} `)})`,
			args: params,
		};
	}

	protected analysisGroups(groups: OrderType = {}): string {
		let keys = Object.keys(groups);

		if (keys.length > 0) {
			let list: string[] = [];
			keys.forEach((i) => {
				let key = i.toString();
				let alias = this.getFieldName(key);
				list.push(`${alias} ${groups[key]}`);
			});

			return `GROUP BY ${list.join(",")}`;
		}

		return "";
	}

	protected analysisOrders(orders: OrderType = {}): string {
		let keys = Object.keys(orders);

		if (keys.length > 0) {
			let list: string[] = [];
			keys.forEach((i) => {
				let key = i.toString();
				let alias = this.getFieldName(key);
				list.push(`${alias} ${orders[key]}`);
			});

			return `ORDER BY ${list.join(",")}`;
		}

		return "";
	}

	protected analysisRow(row: RowData): RowType | null {
		let str: string[] = [];
		let args = Object.keys(row).map((key) => {
			let alias = this.getFieldName(key);
			str.push(`${alias} = ?`);
			return Reflect.get(row, key);
		});

		return {
			args: args,
			sql: str.join(", "),
		};
	}

	protected analysisLimit(limit?: number, offest?: number): string {
		if (typeof limit != "number" || limit < 0) {
			return "";
		}

		let str = `LIMIT ${limit} `;
		if (typeof offest == "number" && offest > 0) {
			str = `LIMIT ${limit}, ${offest} `;
		}

		return str;
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
		rowDataList.forEach((item) => {
			list.push(this.setRow(item));
		});

		return list;
	}

	/***
	 * @version 1.0 更新或者添加记录多条记录(一般用于整条记录的更新)
	 */
	async saveORUpdate(rows: T | T[], @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<number> {
		if (!Array.isArray(rows)) {
			rows = [rows];
		}

		if (rows.length == 0) {
			return Promise.reject(new Error(`rows is empty by ${this.tableName} saveORUpdate`));
		}

		let afterKeys: string[] = Array.of();
		let beforeKeys: string[] = Array.of();

		this.mappingList.forEach((item) => {
			beforeKeys.push(item.field);
			if (!item.primaryKey) {
				afterKeys.push(`${item.field} = VALUES (${item.field})`);
			}
		});

		let args: any[] = [];
		let values: string[] = [];
		let paramsSymbol = new Array(beforeKeys.length).fill("?");

		for (let row of rows) {
			for (let item of this.mappingList) {
				let dbValue = this.toDBValue(row, item.name, item.type);
				args.push(dbValue);
			}
			values.push(`(${paramsSymbol.join(",")})`);
		}

		let valueStr = values.join(",");
		let afterKeyStr = afterKeys.join(",");

		let sql = `INSERT INTO ${this.tableName} (${beforeKeys.join(",")}) VALUES ${valueStr} ON DUPLICATE KEY UPDATE ${afterKeyStr}`;
		let [okPacket] = await this.dsm.exec({ sql, args, ds, sessionId });

		return okPacket.insertId;
	}

	/***
	 * @version 1.0 插入单条记录返回主键
	 */
	async saveOne(row: T, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<number> {
		let params: string[] = [];
		let args: any[] = [];

		for (let item of this.mappingList) {
			let dbValue = this.toDBValue(row, item.name, item.type);
			if (ValidationUtil.isNotNull(dbValue)) {
				params.push(item.field);
				args.push(dbValue);
			}
		}

		let paramsSymbol = new Array(params.length).fill("?").join(",");
		let sql = `INSERT INTO ${this.tableName} (${params.join(",")}) VALUES (${paramsSymbol})`;
		let [res] = await this.dsm.exec({ sql, args, ds, sessionId });

		return res.insertId;
	}

	/***
	 * @version 1.0 批量插入记录
	 */
	async saveList(rows: T[], @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<boolean> {
		if (rows.length < 1) {
			return Promise.reject(new Error("rows is empty"));
		}

		let keys: string[] = Array.of();
		this.mappingList.forEach((item) => {
			keys.push(item.field);
		});

		let keysStr = keys.join(",");
		let sql = `INSERT INTO ${this.tableName} (${keysStr}) VALUES `;
		let paramsStr = new Array(keys.length).fill("?").join(",");

		for (let i = 0; i < rows.length; ) {
			let paramsList: string[] = [];
			let tpmList = rows.slice(0, 1000);
			let args: any[] = [];

			tpmList.forEach((row: T) => {
				this.mappingList.forEach((item) => {
					args.push(this.toDBValue(row, item.name, item.type));
				});
				paramsList.push(`(${paramsStr})`);
			});
			i += tpmList.length;
			let tmpSQL = sql + paramsList.join(",");
			await this.dsm.exec({ sql: tmpSQL, args, ds, sessionId });
		}

		return true;
	}

	/***
	 * @version 1.0 更新记录
	 *
	 */
	async update({ row, where, limit }: SqlUpdate, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<boolean> {
		let rowStr = this.analysisRow(row);
		if (!rowStr) {
			return Promise.reject(new Error("row is empty"));
		}
		let whereC = this.analysisWhere(where);
		let limitStr = this.analysisLimit(limit);
		let sql = `UPDATE ${this.tableName} SET ${rowStr.sql} ${whereC.sql} ${limitStr}`;

		let [okPacket] = await this.dsm.exec({ sql, args: [...rowStr.args, ...whereC.args], ds, sessionId });

		let affectedRows = okPacket.affectedRows;
		let changedRows = okPacket.changedRows;

		return affectedRows > 0 && changedRows > 0;
	}

	/****
	 * @version 1.0 更新一条数据
	 *
	 */
	async updateOne(sqlUpdate: SqlUpdate, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<boolean> {
		return await this.update(Object.assign({}, sqlUpdate, { limit: 1 }), sessionId, ds);
	}

	/***
	 * @version 1.0 根据实体类的主键来更新数据
	 *
	 */
	async updateByPrimaryKey(row: T, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<boolean> {
		let sqlUpdate: SqlUpdate = {
			where: {}, //查询条件
			row: {},
			limit: 1,
		};
		sqlUpdate.where = {};

		for (let item of this.mappingList) {
			let dbValue = this.toDBValue(row, item.name, item.type);
			if (ValidationUtil.isNotNull(dbValue)) {
				if (item.primaryKey) {
					Reflect.set(sqlUpdate.where, item.field, dbValue);
				} else {
					Reflect.set(sqlUpdate.row, item.field, dbValue);
				}
			}
		}

		if (Object.keys(sqlUpdate.where).length == 0) {
			return Promise.reject(new Error(`${this.tableName} primary key  is null`));
		}

		return await this.updateOne(sqlUpdate, sessionId, ds);
	}

	/***
	 * @version 1.0 根据条件进行查找
	 */
	async select(conditions: SqlQuery, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<T[]> {
		let fields = this.analysisFields(conditions.fields);
		let whereC = this.analysisWhere(conditions.where);
		let groupStr = this.analysisGroups(conditions.groups);
		let orderStr = this.analysisOrders(conditions.orders);
		let limitStr = this.analysisLimit(conditions?.limit, conditions?.offest);

		let args = whereC.args;
		let sql = `SELECT ${fields} FROM ${this.tableName} ${whereC.sql} ${groupStr} ${orderStr} ${limitStr}`;

		let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });

		if (!Array.isArray(rows)) {
			return [];
		}

		return this.setRows(rows);
	}

	/***
	 * @version 1.0 查询单个对象
	 *
	 */
	async selectOne(conditions?: SqlQuery, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<T | null> {
		let queryInfo = Object.assign({}, conditions, { limit: 1 });

		let res = await this.select(queryInfo, sessionId, ds);
		let o = res.length > 0 ? res[0] : null;

		return o;
	}

	/***
	 * @version 1.0 通过主键查找对象
	 *
	 */
	async selectByPrimaryKey(row: T, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<T | null> {
		let sqlQuery: SqlQuery = {
			where: {}, //查询条件
			limit: 1,
		};
		sqlQuery.where = {};

		for (let item of this.mappingList) {
			let dbValue = this.toDBValue(row, item.name, item.type);
			if (ValidationUtil.isNotNull(dbValue)) {
				if (item.primaryKey) {
					Reflect.set(sqlQuery.where, item.field, dbValue);
				}
			}
		}

		if (Object.keys(sqlQuery.where).length == 0) {
			return Promise.reject(new Error(`${this.tableName} primary key  is null`));
		}

		return await this.selectOne(sqlQuery, sessionId, ds);
	}

	/***
	 * @version 1.0 判定是否存在
	 *
	 */
	async exist(where: SqlWhere, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<boolean> {
		let whereC = this.analysisWhere(where);
		let args = whereC.args;

		let sql = `SELECT 1 FROM ${this.tableName} ${whereC.sql} LIMIT 1`;
		let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });

		return rows.length > 0;
	}

	/***
	 * @version 1.0 统计符合条件的记录
	 */
	async count(where: SqlWhere, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<number> {
		let whereC = this.analysisWhere(where);
		let args = whereC.args;
		let sql = `SELECT COUNT(1) as num FROM ${this.tableName} ${whereC.sql}`;

		let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });

		return rows[0].num;
	}

	/***
	 * @version 1.0 按照条件删除记录
	 */
	async delete(conditions: SqlDelete, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<boolean> {
		let whereC = this.analysisWhere(conditions.where);
		let limitStr = this.analysisLimit(conditions.limit);

		let sql = `DELETE FROM ${this.tableName} ${whereC.sql} ${limitStr}`;

		let [okPacket] = await this.dsm.exec({ sql, args: whereC.args, ds, sessionId });

		let affectedRows = okPacket.affectedRows;
		return affectedRows > 0;
	}

	/***
	 * @version 1.0 删除某条记录
	 */
	async deleteOne(where: SqlWhere, @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<boolean> {
		return await this.delete(
			{
				where,
				limit: 1,
			},
			sessionId,
			ds
		);
	}

	/***
	 * @version 1.0 自定义sql执行
	 */
	async execute(sql: string, args: any[] = [], @SqlSession sessionId?: string, @DSIndex ds?: string): Promise<any> {
		let [rows] = await this.dsm.exec({ sql, args, ds, sessionId });

		return rows;
	}
}

export default MysqlMapper;
