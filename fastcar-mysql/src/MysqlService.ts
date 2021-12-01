//有空看看java的mybatis的实现方式
import MysqlDataSource from "./dataSource/MysqlDataSource";
import { SqlConfig } from "./type/SqlConfig";
import { SqlQuery } from "./type/operation/SqlQuery";
import { SqlConditions } from "./type/operation/SqlConditions";
import { SqlWhere } from "./type/operation/SqlWhere";
import { SqlUpdate } from "./type/operation/SqlUpdate";
import { SqlDelete } from "./type/operation/SqlDelete";

const nullSet = new Set(...[null, undefined]);
const notNull = ["not null"];

export enum SQLSOURCE {
	read = "read",
	write = "write",
}

/****
 * @version 1.0 采用crud方式进行数据操作
 * @version 1.1 优化order limit 关键词
 * @version 1.2 新增like关键词
 * @version 1.3 优化关键词判空问题
 * @version 1.4 新增非空判断问题
 * @version 1.5 切换为严格模式下运行
 */
export class MysqlService {
	dataSource: Map<string, MysqlDataSource>;

	constructor(configList: SqlConfig[]) {
		this.dataSource = new Map();

		//创建mysql数据源
		configList.forEach(async item => {
			let tmpSource = new MysqlDataSource(item);
			this.dataSource.set(item.source, tmpSource);
		});
	}

	private isBasicType(v: any) {
		let vt = typeof v;
		return ["boolean", "string", "number"].includes(vt);
	}

	private isObjectNotEmpty(o: any) {
		if (nullSet.has(o)) {
			return false;
		}
		return this.isBasicType(o) || Object.keys(o).length > 0;
	}

	private isConditionsNotEmpty(o: Object, key: string) {
		return this.isObjectNotEmpty(o) && Reflect.has(o, key);
	}

	//分析选定字段
	private analysisFields(conditions: SqlConditions = {}) {
		if (!this.isConditionsNotEmpty(conditions, "fields")) {
			return "*";
		}

		if (!conditions.fields) {
			return "*";
		}

		return conditions.fields.join(",");
	}

	private getLikeWord(word: string) {
		if (typeof word != "string") {
			return null;
		}

		let likeStr = word.substring(0, 4).toUpperCase();

		if (likeStr == "LIKE") {
			return word.substring(4).trim();
		}

		return null;
	}

	//解析条件
	//新增like查询
	private analysisWhere(conditions: SqlConditions = {}) {
		if (!conditions?.where) {
			return {
				str: "",
				args: [],
			};
		}

		let whereStr = conditions.where;
		//一般格式为 key:value 或者 key: [value1,value2] 或者 key: value LIKE
		let str = "WHERE ";
		let cList: string[] = [];
		let params: any[] = [];

		Object.keys(whereStr).forEach(cKey => {
			let cValue = whereStr[cKey];

			//判定是否为空
			if (!cValue) {
				cList.push(`${cKey} IS NULL`);
				return;
			}

			if (notNull == cValue) {
				cList.push(`${cKey} IS NOT NULL`);
				return;
			}

			if (Array.isArray(cValue)) {
				cList.push(`${cKey} IN (?)`);
			} else {
				let keyLike = this.getLikeWord(cValue.toString());
				if (!!keyLike) {
					cList.push(`${cKey} LIKE ?`);
					cValue = keyLike;
				} else {
					cList.push(`${cKey} = ?`);
				}
			}

			params.push(cValue);
		});

		str += cList.join(" AND ");

		return {
			str: str,
			args: params,
		};
	}

	private analysisOrders(conditions: SqlConditions) {
		if (conditions?.orders) {
			return `ORDER BY ${conditions.orders.join(", ")}`;
		}

		return "";
	}

	private analysisRow(conditions: SqlConditions) {
		if (!conditions?.row) {
			return null;
		}

		let str: string[] = [];
		let row = conditions.row;
		let args = Object.keys(row).map(key => {
			str.push(`${key} = ? `);
			return Reflect.get(row, key);
		});

		return {
			args: args,
			str: str.join(","),
		};
	}

	private analysisLimit(conditions: SqlConditions) {
		if (!conditions?.limit) {
			return "";
		}

		let str = `LIMIT ${conditions.limit.toString()} `;
		if (!!conditions.offest) {
			str = `LIMIT ${conditions.offest.toString()}, ${conditions.limit.toString()} `;
		}

		return str;
	}

	//查询单个元素 可以根据
	async selectOne(tableName: string, conditions: SqlQuery = {}, sqlSource: string = SQLSOURCE.read): Promise<any> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		//解析查出的参数
		let fields = this.analysisFields(conditions);
		let whereC = this.analysisWhere(conditions);
		let orderStr = this.analysisOrders(conditions);

		let args = whereC.args;
		let sql = `SELECT ${fields} FROM ${tableName} ${whereC.str} ${orderStr} LIMIT 1`;

		let queryRes = await _pool.query(sql, args);
		if (queryRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		if (!Array.isArray(queryRes.data)) {
			queryRes.data = [];
		}

		return Promise.resolve(queryRes.data.length > 0 ? queryRes.data[0] : null);
	}

	//判定是否存在
	async exist(tableName: string, conditions?: SqlWhere, sqlSource: string = SQLSOURCE.read): Promise<boolean> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		let whereC = this.analysisWhere({ where: conditions });
		let args = whereC.args;
		let sql = `SELECT 1 FROM ${tableName} ${whereC.str} LIMIT 1`;

		let queryRes = await _pool.query(sql, args);
		if (queryRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		return queryRes.data && queryRes.data.length > 0;
	}

	async count(tableName: string, conditions?: SqlWhere, sqlSource: string = SQLSOURCE.read): Promise<number> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		let whereC = this.analysisWhere({ where: conditions });
		let args = whereC.args;
		let sql = `SELECT COUNT(1) as num FROM ${tableName} ${whereC.str}`;

		let queryRes = await _pool.query(sql, args);
		if (queryRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		return queryRes.data[0].num;
	}

	//按条件进行查找
	async select(tableName: string, conditions: SqlQuery = {}, sqlSource: string = SQLSOURCE.read): Promise<any[]> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		//解析查出的参数
		let fields = this.analysisFields(conditions);
		let whereC = this.analysisWhere(conditions);
		let orderStr = this.analysisOrders(conditions);
		let limitStr = this.analysisLimit(conditions);

		let args = whereC.args;
		let sql = `SELECT ${fields} FROM ${tableName} ${whereC.str} ${orderStr} ${limitStr}`;

		let queryRes = await _pool.query(sql, args);
		if (queryRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		if (!Array.isArray(queryRes.data)) {
			queryRes.data = [];
		}

		return queryRes.data.length > 0 ? queryRes.data : [];
	}

	//查询全表
	async selectAll(tableName: string, sqlSource: string = SQLSOURCE.read): Promise<any[]> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		let sql = `SELECT * FROM ${tableName}`;
		let queryRes = await _pool.query(sql);
		if (queryRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		if (!Array.isArray(queryRes.data)) {
			queryRes.data = [];
		}

		return queryRes.data;
	}

	//更新单条记录
	async updateOne(tableName: string, conditions: SqlUpdate, sqlSource: string = SQLSOURCE.write) {
		conditions.limit = 1;
		return await this.update(tableName, conditions, sqlSource);
	}

	//按照条件更新记录
	async update(tableName: string, conditions: SqlUpdate, sqlSource: string = SQLSOURCE.write): Promise<boolean> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		let rowStr = this.analysisRow(conditions);
		if (!rowStr) {
			return Promise.reject(new Error("row is empty"));
		}
		let whereC = this.analysisWhere(conditions);
		let limitStr = this.analysisLimit(conditions);
		let sql = `UPDATE ${tableName} SET ${rowStr.str}  ${whereC.str} ${limitStr}`;

		let queryRes = await _pool.query(sql, [...rowStr.args, ...whereC.args]);
		if (queryRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		let affectedRows = queryRes.data.affectedRows;
		let changedRows = queryRes.data.changedRows;
		return affectedRows > 0 && changedRows > 0;
	}

	//删除某条记录
	async deleteOne(tableName: string, conditions: SqlConditions = {}, sqlSource: string = SQLSOURCE.write): Promise<boolean> {
		conditions.limit = 1;
		return await this.delete(tableName, conditions, sqlSource);
	}

	//按照条件删除记录
	async delete(tableName: string, conditions: SqlDelete = {}, sqlSource: string = SQLSOURCE.write): Promise<boolean> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		let whereC = this.analysisWhere(conditions);
		let limitStr = this.analysisLimit(conditions);

		let sql = `DELETE FROM ${tableName} ${whereC.str} ${limitStr}`;

		let queryRes = await _pool.query(sql, [...whereC.args]);
		if (queryRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		let affectedRows = queryRes.data.affectedRows;
		let changedRows = queryRes.data.changedRows;

		return affectedRows > 0 && changedRows > 0;
	}

	//更新或者添加记录多条记录
	async saveORUpdate(tableName: string, rows: any | object[], sqlSource: string = SQLSOURCE.write): Promise<boolean> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return false;
		}

		if (!Array.isArray(rows)) {
			rows = [rows];
		}

		if (rows.length == 0) {
			return false;
		}

		let fields = rows[0];
		let keys = Object.keys(fields);

		let afterKeys = keys.map((key: string) => {
			return `${key} = VALUES (${key})`;
		});

		let values: string[] = [];
		rows.forEach((row: any) => {
			let valueStr = "";
			keys.forEach(key => {
				if (row[key] === "" || row[key] === null) {
					row[key] = null;
				} else {
					if (typeof key === "string") {
						//字符串添加转义
						row[key] = `'${row[key]}'`;
					}
				}

				valueStr += "," + row[key];
			});

			values.push(`(${valueStr.substring(1)})`);
		});

		let valueStr = values.join(",");
		let afterKeyStr = afterKeys.join(",");

		let sql = `INSERT INTO ${tableName} (${keys.join(",")}) VALUES ${valueStr} ON DUPLICATE KEY UPDATE ${afterKeyStr}`;
		let queryRes = await _pool.query(sql);

		return !queryRes.error;
	}

	//插入单条记录返回主键
	async saveOne(tableName: string, row: Object, sqlSource: string = SQLSOURCE.write): Promise<number> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		//参数名 参数值
		let paramsSymbol: string[] = [];
		let values: string[] = [];
		let params = Object.keys(row).map(key => {
			paramsSymbol.push("?");
			values.push(Reflect.get(row, key));
			return key;
		});

		let sql = `INSERT INTO ${tableName} (${params.join(",")}) VALUES (${paramsSymbol.join(",")})`;
		let addRes = await _pool.query(sql, values);

		if (addRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		return addRes.data.insertId;
	}

	//批量插入记录
	async saveList(tableName: string, rows: any[], sqlSource: string = SQLSOURCE.write): Promise<boolean> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		if (rows.length < 1) {
			return Promise.reject(new Error("rows is empty"));
		}

		let row = rows[0];
		let values = [];
		let params = Object.keys(row).map(key => {
			values.push(row[key]);
			return key;
		});
		let sql = `INSERT INTO ${tableName}  (${params.join(",")}) VALUES `;

		for (let i = 0; i < rows.length; ) {
			let valueList: string[] = [];
			let tpmList = rows.slice(0, 1000);
			tpmList = tpmList.map(tp => {
				let transVal: string[] = [];
				params.forEach((pi: string) => {
					if (typeof tp[pi] === "string") {
						//字符串添加转义
						tp[pi] = `'${tp[pi]}'`;
					}

					transVal.push(tp[pi]);
				});

				return transVal;
			});
			i += tpmList.length;

			tpmList.forEach(item => {
				let tmpValue = `(${item.join(",")})`;
				valueList.push(tmpValue);
			});

			let tmpSQL = sql + valueList.join(",");
			await _pool.query(tmpSQL, []);
		}

		return true;
	}

	//按照原始的sql进行查找
	async query(sql: string, args: any[] = [], sqlSource: string = SQLSOURCE.read): Promise<any> {
		let _pool = this.dataSource.get(sqlSource);
		if (!_pool) {
			return Promise.reject(new Error("pool is empty"));
		}

		let queryRes = await _pool.query(sql, args);
		if (queryRes.error) {
			return Promise.reject(new Error(`sql is error ${sql}`));
		}

		return queryRes.data;
	}
}
