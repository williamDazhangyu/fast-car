import { SqlConditions } from "./SqlConditions";

const nullSet = new Set(...[null, undefined]);
const notNull = ["not null"];

type RowType = {
	str: string;
	args: Array<any>;
};

class MysqlCRUD {
	static isBasicType(v: any): boolean {
		let vt = typeof v;
		return ["boolean", "string", "number"].includes(vt);
	}

	static isObjectNotEmpty(o: any): boolean {
		if (nullSet.has(o)) {
			return false;
		}
		return this.isBasicType(o) || Object.keys(o).length > 0;
	}

	static isConditionsNotEmpty(o: Object, key: string): boolean {
		return this.isObjectNotEmpty(o) && Reflect.has(o, key);
	}

	//分析选定字段
	static analysisFields(conditions: SqlConditions = {}): string {
		if (!this.isConditionsNotEmpty(conditions, "fields")) {
			return "*";
		}

		if (!conditions.fields) {
			return "*";
		}

		return conditions.fields.join(",");
	}

	static getLikeWord(word: string): string | null {
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
	static analysisWhere(conditions: SqlConditions = {}): RowType {
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

		Object.keys(whereStr).forEach((cKey) => {
			let cValue = whereStr[cKey];

			//判定是否为空
			if (!cValue) {
				cList.push(`ISNULL(${cKey})`);
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

	static analysisOrders(conditions: SqlConditions): string {
		if (conditions?.orders) {
			return `ORDER BY ${conditions.orders.join(", ")}`;
		}

		return "";
	}

	static analysisRow(conditions: SqlConditions): RowType | null {
		if (!conditions?.row) {
			return null;
		}

		let str: string[] = [];
		let row = conditions.row;
		let args = Object.keys(row).map((key) => {
			str.push(`${key} = ? `);
			return Reflect.get(row, key);
		});

		return {
			args: args,
			str: str.join(","),
		};
	}

	static analysisLimit(conditions: SqlConditions): string {
		if (!conditions?.limit) {
			return "";
		}

		let str = `LIMIT ${conditions.limit.toString()} `;
		if (!!conditions.offest) {
			str = `LIMIT ${conditions.offest.toString()}, ${conditions.limit.toString()} `;
		}

		return str;
	}
}

export default MysqlCRUD;
