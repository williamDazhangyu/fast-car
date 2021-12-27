import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";
import { Autowired } from "fastcar-core/annotation";
import MysqlDataSourceManager from "../dataSource/MysqlDataSourceManager";
import { OrderType, RowData, SqlDelete, SqlQuery, SqlUpdate, SqlWhere } from "./OperationType";
import { MapperType } from "../type/MapperType";
import { OperatorEnum } from "./OperationType";
import { DataFormat, ValidationUtil } from "fastcar-core/utils";
import SerializeUtil from "../util/SerializeUtil";
import SqlError from "../type/SqlError";

type RowType = {
	str: string;
	args: Array<any>;
};

/****
 * @version 1.0 采用crud方式进行数据操作
 */
class MysqlMapper<T extends Object> {
	@Autowired
	protected dsm!: MysqlDataSourceManager;

	protected tableName: string;
	protected classZ: any; //映射的原型类
	protected mappingMap: Map<string, MapperType>; //代码别名-映射关系
	protected mappingList: MapperType[];
	protected dbFields: Map<string, string>; //数据库别名-代码别名

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
	protected getFieldName(name: string) {
		let info = this.mappingMap.get(name);
		return info ? info.field : name;
	}

	//自动映射数据库字段
	protected toDBValue(v: any, key: string, type: string) {
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
	protected analysisWhere(where: SqlWhere = {}): RowType {
		let keys = Reflect.ownKeys(where);
		let maxLength = keys.length;

		if (maxLength <= 0) {
			return {
				str: "",
				args: [],
			};
		}

		let str = "WHERE ";
		let cList: string[] = [];
		let params: any[] = [];

		keys.forEach((i, index) => {
			let key = i.toString();
			let alias = this.getFieldName(key);
			let item: any = where[key];
			let tmpStr = "";

			//这边进行一个类型推断
			let outerJoin = "AND";
			let typeStr = typeof item;
			if (typeStr != "object" || !Reflect.has(item, "value")) {
				if (item == null) {
					tmpStr = `ISNULL(${alias})`;
				} else if (Array.isArray(item)) {
					tmpStr = `${alias} IN (?)`;
					params.push(item);
				} else {
					tmpStr = `${alias} = ?`;
					params.push(item);
				}
			} else {
				if (!item.operator) {
					item.operator = Array.isArray(item.value) ? OperatorEnum.in : OperatorEnum.eq;
				}

				//规避sql注入 统一使用?做处理
				switch (item.operator) {
					case OperatorEnum.isNUll: {
						tmpStr = `ISNULL(${alias})`;
						break;
					}
					case OperatorEnum.isNotNull: {
						tmpStr = `${alias} IS NOT NULL`;
						break;
					}
					default: {
						tmpStr = `${alias} ${item.operator} ?`;
						params.push(item.value);
						break;
					}
				}

				if (item?.operator) {
					outerJoin = item?.operator;
				}
			}

			if (index < maxLength - 1 && tmpStr) {
				tmpStr += `${outerJoin}`;
			}
			cList.push(tmpStr);
		});

		str += cList.join(" ");
		return {
			str: str,
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
			str: str.join(", "),
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

	//获取默认数据源 这边可以自行拓展
	getDataSource(read: boolean = true): string {
		let classDefaultDS = Reflect.getMetadata(DesignMeta.ds, this);
		if (classDefaultDS) {
			return classDefaultDS;
		}

		return this.dsm.getDefaultSoucre(read);
	}

	/***
	 * @version 1.0 更新或者添加记录多条记录(一般用于整条记录的更新)
	 */
	async saveORUpdate(rows: T | T[], ds: string = this.getDataSource(false)): Promise<number> {
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
				if (ValidationUtil.isNull(dbValue)) {
					if (item.notNull) {
						return Promise.reject(new SqlError(`${item.name} value is null`));
					}
				}

				args.push(dbValue);
			}
			values.push(`(${paramsSymbol.join(",")})`);
		}

		let valueStr = values.join(",");
		let afterKeyStr = afterKeys.join(",");

		let sql = `INSERT INTO ${this.tableName} (${beforeKeys.join(",")}) VALUES ${valueStr} ON DUPLICATE KEY UPDATE ${afterKeyStr}`;
		let [okPacket] = await this.dsm.execute({ sql, args, ds });

		return okPacket.insertId;
	}

	/***
	 * @version 1.0 插入单条记录返回主键
	 */
	async saveOne(row: T, ds: string = this.getDataSource(false)): Promise<number> {
		let params: string[] = [];
		let args: any[] = [];

		for (let item of this.mappingList) {
			let dbValue = this.toDBValue(row, item.name, item.type);
			if (ValidationUtil.isNotNull(dbValue)) {
				params.push(item.field);
				args.push(dbValue);
			} else {
				if (item.notNull) {
					return Promise.reject(new SqlError(`${item.name} value is null`));
				}
			}
		}

		let paramsSymbol = new Array(params.length).fill("?").join(",");
		let sql = `INSERT INTO ${this.tableName} (${params.join(",")}) VALUES (${paramsSymbol})`;
		let [res] = await this.dsm.execute({ sql, args, ds });

		return res.insertId;
	}

	/***
	 * @version 1.0 批量插入记录
	 */
	async saveList(rows: T[], ds: string = this.getDataSource(false)): Promise<boolean> {
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
			await this.dsm.execute({ sql: tmpSQL, args, ds });
		}

		return true;
	}

	/***
	 * @version 1.0 更新记录
	 *
	 */
	async update(sqlUpdate: SqlUpdate, ds: string = this.getDataSource(false)): Promise<boolean> {
		let rowStr = this.analysisRow(sqlUpdate.row);
		if (!rowStr) {
			return Promise.reject(new Error("row is empty"));
		}
		let whereC = this.analysisWhere(sqlUpdate.where);
		let limitStr = this.analysisLimit(sqlUpdate.limit);
		let sql = `UPDATE ${this.tableName} SET ${rowStr.str} ${whereC.str} ${limitStr}`;

		let [okPacket] = await this.dsm.execute({ sql, args: [...rowStr.args, ...whereC.args], ds });

		let affectedRows = okPacket.affectedRows;
		let changedRows = okPacket.changedRows;
		return affectedRows > 0 && changedRows > 0;
	}

	/****
	 * @version 1.0 更新一条数据
	 *
	 */
	async updateOne(sqlUpdate: SqlUpdate, ds: string = this.getDataSource(false)) {
		return await this.update(Object.assign({}, sqlUpdate, { limit: 1 }), ds);
	}

	/***
	 * @version 1.0 根据实体类的主键来更新数据
	 *
	 */
	async updateByPrimaryKey(row: T, ds: string = this.getDataSource(false)) {
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

		return await this.updateOne(sqlUpdate, ds);
	}

	/***
	 * @version 1.0 根据条件进行查找
	 */
	async select(conditions: SqlQuery = {}, ds: string = this.getDataSource()): Promise<T[]> {
		let fields = this.analysisFields(conditions.fields);
		let whereC = this.analysisWhere(conditions.where);
		let groupStr = this.analysisGroups(conditions.groups);
		let orderStr = this.analysisOrders(conditions.orders);
		let limitStr = this.analysisLimit(conditions?.limit, conditions?.offest);

		let args = whereC.args;
		let sql = `SELECT ${fields} FROM ${this.tableName} ${whereC.str} ${groupStr} ${orderStr} ${limitStr}`;

		let [rows] = await this.dsm.execute({ sql, args, ds });

		if (!Array.isArray(rows)) {
			return [];
		}

		return this.setRows(rows);
	}

	/***
	 * @version 1.0 查询单个对象
	 *
	 */
	async selectOne(conditions: SqlQuery = {}, ds: string = this.getDataSource()): Promise<T | null> {
		let queryInfo = Object.assign({}, conditions, { limit: 1 });

		let res = await this.select(queryInfo, ds);
		let o = res.length > 0 ? res[0] : null;

		return o;
	}

	/***
	 * @version 1.0 通过主键查找对象
	 *
	 */
	async selectByPrimaryKey(row: T, ds: string = this.getDataSource()): Promise<T | null> {
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

		return await this.selectOne(sqlQuery, ds);
	}

	/***
	 * @version 1.0 判定是否存在
	 *
	 */
	async exist(sqlWhere: SqlWhere, ds: string = this.getDataSource()): Promise<boolean> {
		let whereC = this.analysisWhere(sqlWhere);
		let args = whereC.args;

		let sql = `SELECT 1 FROM ${this.tableName} ${whereC.str} LIMIT 1`;
		let [rows] = await this.dsm.execute({ sql, args, ds });

		return rows.length > 0;
	}

	/***
	 * @version 1.0 统计符合条件的记录
	 */
	async count(sqlWhere: SqlWhere, ds: string = this.getDataSource()): Promise<number> {
		let whereC = this.analysisWhere(sqlWhere);
		let args = whereC.args;
		let sql = `SELECT COUNT(1) as num FROM ${this.tableName} ${whereC.str}`;

		let [rows] = await this.dsm.execute({ sql, args, ds });

		return rows[0].num;
	}

	/***
	 * @version 1.0 按照条件删除记录
	 */
	async delete(sqlDelete: SqlDelete, ds: string = this.getDataSource(false)): Promise<boolean> {
		let whereC = this.analysisWhere(sqlDelete.where);
		let limitStr = this.analysisLimit(sqlDelete.limit);

		let sql = `DELETE FROM ${this.tableName} ${whereC.str} ${limitStr}`;

		let [okPacket] = await this.dsm.execute({ sql, args: whereC.args, ds });

		let affectedRows = okPacket.affectedRows;
		return affectedRows > 0;
	}

	/***
	 * @version 1.0 删除某条记录
	 */
	async deleteOne(sqlWhere: SqlWhere, ds: string = this.getDataSource(false)): Promise<boolean> {
		return await this.delete(
			{
				where: sqlWhere,
				limit: 1,
			},
			ds
		);
	}

	/***
	 * @version 1.0 自定义sql执行
	 */
	async execute(sql: string, args: any[] = [], ds: string = this.getDataSource()): Promise<any> {
		let [rows] = await this.dsm.execute({ sql, args, ds });

		return rows;
	}
}

export default MysqlMapper;
