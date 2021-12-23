import "reflect-metadata";
import { DesignMeta } from "../type/DesignMeta";
import { Autowired } from "fastcar-core/annotation";
import MysqlDataSourceManager from "../dataSource/MysqlDataSourceManager";
import { OrderEnum, OrderType, SqlQuery, SqlWhere } from "./OperationType";
import { MapperType } from "../type/MapperType";
import { OperatorEnum, SqlConditions } from "./OperationType";
import { DataFormat } from "fastcar-core/utils";

type RowType = {
	str: string;
	args: Array<any>;
};

/****
 * @version 1.0 采用crud方式进行数据操作
 */
class MysqlMapper<T> {
	@Autowired
	protected dsm!: MysqlDataSourceManager;

	protected tableName: string;
	protected classZ: any; //映射的原型类
	protected mappingMap: Map<string, MapperType>; //代码别名-映射关系
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
	}

	//获取数据库别名通过代码内的名称
	protected getFieldName(name: string) {
		let info = this.mappingMap.get(name);
		return info ? info.field : name;
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
			let item = where[key];
			let tmpStr = "";

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

			let outerJoin = item?.operator || "AND";
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

	protected analysisRow(row?: Object): RowType | null {
		if (!row) {
			return null;
		}

		let str: string[] = [];
		let args = Object.keys(row).map((key) => {
			let alias = this.getFieldName(key);
			str.push(`${alias} = ? `);
			return Reflect.get(row, key);
		});

		return {
			args: args,
			str: str.join(","),
		};
	}

	protected analysisLimit(conditions: SqlConditions): string {
		if (!conditions?.limit) {
			return "";
		}

		let str = `LIMIT ${conditions.limit} `;
		if (!!conditions.offest) {
			str = `LIMIT ${conditions.offest}, ${conditions.limit} `;
		}

		return str;
	}

	protected setRow(rowData: Object): T {
		let t = new this.classZ();

		this.mappingMap.forEach((item, key) => {
			let value = Reflect.get(rowData, item.field) || Reflect.get(rowData, key);
			if (value != null) {
				let fvalue = DataFormat.formatValue(value, item.tsType);
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

	//查询单个元素 可以根据
	async selectOne(conditions: SqlQuery = {}, ds: string = this.getDataSource()): Promise<T | null> {
		let fields = this.analysisFields(conditions.fields);
		let whereC = this.analysisWhere(conditions.where);
		let groupStr = this.analysisGroups(conditions.groups);
		let orderStr = this.analysisOrders(conditions.orders);

		let args = whereC.args;
		let sql = `SELECT ${fields} FROM ${this.tableName} ${whereC.str} ${groupStr} ${orderStr} LIMIT 1`;

		let [rows] = await this.dsm.execute({ sql, args, ds });

		if (!Array.isArray(rows)) {
			rows = [];
		}

		let o = rows.length > 0 ? rows[0] : null;
		if (o) {
			return this.setRow(o);
		}

		return null;
	}

	// //判定是否存在
	// async exist(tableName: string, conditions?: SqlWhere, sqlSource: string = SQLSOURCE.read): Promise<boolean> {
	// 	let _pool = this.dataSource.get(sqlSource);
	// 	if (!_pool) {
	// 		return Promise.reject(new Error("pool is empty"));
	// 	}

	// 	let whereC = MysqlCRUD.analysisWhere({ where: conditions });
	// 	let args = whereC.args;
	// 	let sql = `SELECT 1 FROM ${tableName} ${whereC.str} LIMIT 1`;

	// 	let queryRes = await _pool.query(sql, args);
	// 	if (queryRes.error) {
	// 		return Promise.reject(new Error(`sql is error ${sql}`));
	// 	}

	// 	return queryRes.data && queryRes.data.length > 0;
	// }

	// async count(tableName: string, conditions?: SqlWhere, sqlSource: string = SQLSOURCE.read): Promise<number> {
	// 	let _pool = this.dataSource.get(sqlSource);
	// 	if (!_pool) {
	// 		return Promise.reject(new Error("pool is empty"));
	// 	}

	// 	let whereC = MysqlCRUD.analysisWhere({ where: conditions });
	// 	let args = whereC.args;
	// 	let sql = `SELECT COUNT(1) as num FROM ${tableName} ${whereC.str}`;

	// 	let queryRes = await _pool.query(sql, args);
	// 	if (queryRes.error) {
	// 		return Promise.reject(new Error(`sql is error ${sql}`));
	// 	}

	// 	return queryRes.data[0].num;
	// }

	// //按条件进行查找
	// async select(tableName: string, conditions: SqlQuery = {}, sqlSource: string = SQLSOURCE.read): Promise<any[]> {
	// 	let _pool = this.dataSource.get(sqlSource);
	// 	if (!_pool) {
	// 		return Promise.reject(new Error("pool is empty"));
	// 	}

	// 	//解析查出的参数
	// 	let fields = MysqlCRUD.analysisFields(conditions);
	// 	let whereC = MysqlCRUD.analysisWhere(conditions);
	// 	let orderStr = MysqlCRUD.analysisOrders(conditions);
	// 	let limitStr = MysqlCRUD.analysisLimit(conditions);

	// 	let args = whereC.args;
	// 	let sql = `SELECT ${fields} FROM ${tableName} ${whereC.str} ${orderStr} ${limitStr}`;

	// 	let queryRes = await _pool.query(sql, args);
	// 	if (queryRes.error) {
	// 		return Promise.reject(new Error(`sql is error ${sql}`));
	// 	}

	// 	if (!Array.isArray(queryRes.data)) {
	// 		queryRes.data = [];
	// 	}

	// 	return queryRes.data.length > 0 ? queryRes.data : [];
	// }

	// //查询全表
	// async selectAll(tableName: string, sqlSource: string = SQLSOURCE.read): Promise<any[]> {
	// 	let _pool = this.dataSource.get(sqlSource);
	// 	if (!_pool) {
	// 		return Promise.reject(new Error("pool is empty"));
	// 	}

	// 	let sql = `SELECT * FROM ${tableName}`;
	// 	let queryRes = await _pool.query(sql);
	// 	if (queryRes.error) {
	// 		return Promise.reject(new Error(`sql is error ${sql}`));
	// 	}

	// 	if (!Array.isArray(queryRes.data)) {
	// 		queryRes.data = [];
	// 	}

	// 	return queryRes.data;
	// }

	// //更新单条记录
	// async updateOne(tableName: string, conditions: SqlUpdate, sqlSource: string = SQLSOURCE.write) {
	// 	conditions.limit = 1;
	// 	return await this.update(tableName, conditions, sqlSource);
	// }

	// //按照条件更新记录
	// async update(tableName: string, conditions: SqlUpdate, sqlSource: string = SQLSOURCE.write): Promise<boolean> {
	// 	let _pool = this.dataSource.get(sqlSource);
	// 	if (!_pool) {
	// 		return Promise.reject(new Error("pool is empty"));
	// 	}

	// 	let rowStr = MysqlCRUD.analysisRow(conditions);
	// 	if (!rowStr) {
	// 		return Promise.reject(new Error("row is empty"));
	// 	}
	// 	let whereC = MysqlCRUD.analysisWhere(conditions);
	// 	let limitStr = MysqlCRUD.analysisLimit(conditions);
	// 	let sql = `UPDATE ${tableName} SET ${rowStr.str}  ${whereC.str} ${limitStr}`;

	// 	let queryRes = await _pool.query(sql, [...rowStr.args, ...whereC.args]);
	// 	if (queryRes.error) {
	// 		return Promise.reject(new Error(`sql is error ${sql}`));
	// 	}

	// 	let affectedRows = queryRes.data.affectedRows;
	// 	let changedRows = queryRes.data.changedRows;
	// 	return affectedRows > 0 && changedRows > 0;
	// }

	// //删除某条记录
	// async deleteOne(tableName: string, conditions: SqlConditions = {}, sqlSource: string = SQLSOURCE.write): Promise<boolean> {
	// 	conditions.limit = 1;
	// 	return await this.delete(tableName, conditions, sqlSource);
	// }

	// //按照条件删除记录
	// async delete(tableName: string, conditions: SqlDelete = {}, sqlSource: string = SQLSOURCE.write): Promise<boolean> {
	// 	let _pool = this.dataSource.get(sqlSource);
	// 	if (!_pool) {
	// 		return Promise.reject(new Error("pool is empty"));
	// 	}

	// 	let whereC = MysqlCRUD.analysisWhere(conditions);
	// 	let limitStr = MysqlCRUD.analysisLimit(conditions);

	// 	let sql = `DELETE FROM ${tableName} ${whereC.str} ${limitStr}`;

	// 	let queryRes = await _pool.query(sql, [...whereC.args]);
	// 	if (queryRes.error) {
	// 		return Promise.reject(new Error(`sql is error ${sql}`));
	// 	}

	// 	let affectedRows = queryRes.data.affectedRows;
	// 	let changedRows = queryRes.data.changedRows;

	// 	return affectedRows > 0 && changedRows > 0;
	// }

	// //更新或者添加记录多条记录
	// async saveORUpdate(tableName: string, rows: any | object[], sqlSource: string = SQLSOURCE.write): Promise<boolean> {
	// 	let _pool = this.dataSource.get(sqlSource);
	// 	if (!_pool) {
	// 		return false;
	// 	}

	// 	if (!Array.isArray(rows)) {
	// 		rows = [rows];
	// 	}

	// 	if (rows.length == 0) {
	// 		return false;
	// 	}

	// 	let fields = rows[0];
	// 	let keys = Object.keys(fields);

	// 	let afterKeys = keys.map((key: string) => {
	// 		return `${key} = VALUES (${key})`;
	// 	});

	// 	let values: string[] = [];
	// 	rows.forEach((row: any) => {
	// 		let valueStr = "";
	// 		keys.forEach((key) => {
	// 			if (row[key] === "" || row[key] === null) {
	// 				row[key] = null;
	// 			} else {
	// 				if (typeof key === "string") {
	// 					//字符串添加转义
	// 					row[key] = `'${row[key]}'`;
	// 				}
	// 			}

	// 			valueStr += "," + row[key];
	// 		});

	// 		values.push(`(${valueStr.substring(1)})`);
	// 	});

	// 	let valueStr = values.join(",");
	// 	let afterKeyStr = afterKeys.join(",");

	// 	let sql = `INSERT INTO ${tableName} (${keys.join(",")}) VALUES ${valueStr} ON DUPLICATE KEY UPDATE ${afterKeyStr}`;
	// 	let queryRes = await _pool.query(sql);

	// 	return !queryRes.error;
	// }

	// //插入单条记录返回主键
	// async saveOne(tableName: string, row: Object, sqlSource: string = SQLSOURCE.write): Promise<number> {
	// 	let _pool = this.dataSource.get(sqlSource);
	// 	if (!_pool) {
	// 		return Promise.reject(new Error("pool is empty"));
	// 	}

	// 	//参数名 参数值
	// 	let paramsSymbol: string[] = [];
	// 	let values: string[] = [];
	// 	let params = Object.keys(row).map((key) => {
	// 		paramsSymbol.push("?");
	// 		values.push(Reflect.get(row, key));
	// 		return key;
	// 	});

	// 	let sql = `INSERT INTO ${tableName} (${params.join(",")}) VALUES (${paramsSymbol.join(",")})`;
	// 	let addRes = await _pool.query(sql, values);

	// 	if (addRes.error) {
	// 		return Promise.reject(new Error(`sql is error ${sql}`));
	// 	}

	// 	return addRes.data.insertId;
	// }

	// //批量插入记录
	// async saveList(tableName: string, rows: any[]): Promise<boolean> {
	// 	if (rows.length < 1) {
	// 		return Promise.reject(new Error("rows is empty"));
	// 	}

	// 	let row = rows[0];
	// 	let values = [];
	// 	let params = Object.keys(row).map((key) => {
	// 		values.push(row[key]);
	// 		return key;
	// 	});
	// 	let sql = `INSERT INTO ${tableName}  (${params.join(",")}) VALUES `;

	// 	for (let i = 0; i < rows.length; ) {
	// 		let valueList: string[] = [];
	// 		let tpmList = rows.slice(0, 1000);
	// 		tpmList = tpmList.map((tp) => {
	// 			let transVal: string[] = [];
	// 			params.forEach((pi: string) => {
	// 				if (typeof tp[pi] === "string") {
	// 					//字符串添加转义
	// 					tp[pi] = `'${tp[pi]}'`;
	// 				}

	// 				transVal.push(tp[pi]);
	// 			});

	// 			return transVal;
	// 		});
	// 		i += tpmList.length;

	// 		tpmList.forEach((item) => {
	// 			let tmpValue = `(${item.join(",")})`;
	// 			valueList.push(tmpValue);
	// 		});

	// 		let tmpSQL = sql + valueList.join(",");
	// 		await _pool.query(tmpSQL, []);
	// 	}

	// 	return true;
	// }

	// //按照原始的sql进行查找
	// async query(sql: string, args: any[] = [], sqlSource: string = SQLSOURCE.read): Promise<any> {
	// 	let queryRes = await _pool.query(sql, args);
	// 	if (queryRes.error) {
	// 		return Promise.reject(new Error(`sql is error ${sql}`));
	// 	}

	// 	return queryRes.data;
	// }
}

export default MysqlMapper;
