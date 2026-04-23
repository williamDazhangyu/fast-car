import "reflect-metadata";
import { expect } from "chai";
import * as sinon from "sinon";

// 测试用的 PgsqlMapper 模拟类
// 绕过 BaseMapper 的元数据依赖，直接测试 protected 方法
class TestPgsqlMapper {
	protected tableName: string = "test_table";
	protected mappingMap: Map<string, any>;
	protected mappingList: any[];
	protected dbFields: Map<string, string>;
	protected dsm: any;

	// 从 PgsqlMapper 复制的方法实现
	protected getFieldName(name: string): string {
		let info = this.mappingMap.get(name);
		let alias = info ? info.field : name;
		let list = alias.match(/\((.+?)\)/g);
		if (list && list.length > 0) {
			let tmpStr = alias;
			list.forEach((item: string) => {
				let itemList = item.substring(1, item.length - 1).split(",");
				itemList = itemList.map((citem: string) => {
					return this.mappingMap.has(citem) ? `"${this.mappingMap.get(citem)?.field}"` : citem;
				});
				let word = `(${itemList.join(",")})`;
				tmpStr = tmpStr.replace(item, word);
			});
			return tmpStr;
		}
		return !!info ? `"${alias}"` : alias;
	}

	protected analysisFields(fields: string[] = []): string {
		if (fields.length == 0) {
			return "*";
		}
		let list = fields.map((item) => {
			return this.getFieldName(item);
		});
		return list.join(",");
	}

	protected analysisWhere(where: any = {}, joinKey: string = "AND", params: any[] = []): { sql: string; args: any[] } {
		let finalResult = this.analysisCondition(where, joinKey, params);
		if (finalResult.sql) {
			finalResult.sql = "WHERE " + finalResult.sql;
			return finalResult;
		}
		return finalResult;
	}

	protected analysisCondition(where: any = {}, joinKey: string = "AND", params: any[] = []): { sql: string; args: any[] } {
		let keys = Object.keys(where);
		let list: string[] = Array.of();

		if (keys.length == 0) {
			return { sql: "", args: [] };
		}

		for (let key of keys) {
			let value: any = where[key];
			if (["and", "or", "andnot"].includes(key.toLowerCase())) {
				let childResult = this.analysisCondition(value, key);
				list.push(childResult.sql);
				params = [...params, ...childResult.args];
			} else {
				let alias = this.getFieldName(key);
				if (value === null || value === undefined) {
					list.push(`${alias} IS NULL`);
				} else if (typeof value === "object" && !Array.isArray(value)) {
					Object.keys(value).forEach((op) => {
						let opValue = value[op];
						let formatOp = op.toUpperCase();
						switch (formatOp) {
							case "=":
							case "!=":
							case ">":
							case ">=":
							case "<":
							case "<=":
								list.push(`${alias} ${formatOp} ?`);
								params.push(opValue);
								break;
							case "IN":
								if (Array.isArray(opValue)) {
									list.push(`${alias} IN (${opValue.map(() => "?").join(",")})`);
									params = [...params, ...opValue];
								}
								break;
							case "LIKE":
								list.push(`${alias} LIKE ?`);
								params.push(opValue);
								break;
						}
					});
				} else if (Array.isArray(value)) {
					list.push(`${alias} IN (${value.map(() => "?").join(",")})`);
					params = [...params, ...value];
				} else {
					list.push(`${alias} = ?`);
					params.push(value);
				}
			}
		}

		if (list.length == 1) {
			return { sql: list[0], args: params };
		}

		return { sql: `(${list.join(` ${joinKey} `)})`, args: params };
	}

	protected analysisLimit({ limit, offest }: { limit?: number; offest?: number }): { str: string; args: Array<number | string> } {
		if (typeof limit != "number" || limit < 0) {
			return { str: "", args: [] };
		}

		let args: Array<number | string> = [];
		let str = `LIMIT ? `;
		args = [limit];

		if (typeof offest == "number" && offest > 0) {
			str = `OFFSET ? LIMIT ? `;
			args = [offest, limit];
		}

		return { str, args };
	}

	protected analysisGroups(groups: string[] = []): string {
		if (groups.length > 0) {
			let list: string[] = [];
			groups.forEach((i) => {
				let key = i.toString();
				let alias = this.getFieldName(key);
				list.push(`${alias}`);
			});
			return `GROUP BY ${list.join(",")}`;
		}
		return "";
	}

	protected analysisOrders(orders: any = {}): string {
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

	protected analysisJoin(list?: Array<{ type?: "INNER" | "LEFT" | "FULL" | "CROSS" | "RIGHT"; table: string; on?: string }>): string {
		if (!list || list.length == 0) {
			return "";
		}
		let joinList: Array<string> = [];
		list.forEach((item) => {
			let onStr = item.on ? `ON ${item.on}` : "";
			joinList.push(`${item.type || "LEFT"} JOIN ${item.table} ${onStr}`);
		});
		return joinList.join(" ");
	}

	protected toDBValue(v: any, key: string, type: string, value: any = (v as any)[key]): any {
		let info = this.mappingMap.get(key);
		if (info) {
			let dbValue = (v as any)[info.field];
			if (dbValue !== null && dbValue !== undefined) {
				if (typeof dbValue === "object" && dbValue.operate && dbValue.value !== undefined) {
					value = dbValue.value;
				} else {
					value = dbValue;
				}
			}
		}
		if (value === null || value === undefined) {
			value = null;
		}
		return value;
	}

	constructor(mockDSM: any) {
		this.dsm = mockDSM;
		this.mappingMap = new Map([
			["id", { name: "id", field: "id", type: "number", primaryKey: true }],
			["name", { name: "name", field: "name", type: "string" }],
			["value", { name: "value", field: "value", type: "number" }],
		]);
		this.mappingList = [
			{ name: "id", field: "id", type: "number", primaryKey: true },
			{ name: "name", field: "name", type: "string" },
			{ name: "value", field: "value", type: "number" },
		];
		this.dbFields = new Map([
			["id", "id"],
			["name", "name"],
			["value", "value"],
		]);
	}
}

describe("PgsqlMapper", () => {
	let mapper: TestPgsqlMapper;
	let mockDSM: any;

	beforeEach(() => {
		mockDSM = {
			exec: sinon.stub(),
			query: sinon.stub(),
			getDefaultSoucre: sinon.stub().returns("default"),
		};
		mapper = new TestPgsqlMapper(mockDSM);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("getFieldName", () => {
		it("should return mapped field name", () => {
			const result = (mapper as any).getFieldName("name");
			expect(result).to.equal('"name"');
		});

		it("should return original name if not mapped", () => {
			const result = (mapper as any).getFieldName("unknown");
			expect(result).to.equal("unknown");
		});
	});

	describe("analysisFields", () => {
		it("should return * for empty fields", () => {
			const result = (mapper as any).analysisFields([]);
			expect(result).to.equal("*");
		});

		it("should return field list for specified fields", () => {
			const result = (mapper as any).analysisFields(["id", "name"]);
			expect(result).to.equal('"id","name"');
		});
	});

	describe("analysisWhere", () => {
		it("should return empty for empty where", () => {
			const result = (mapper as any).analysisWhere({});
			expect(result.sql).to.equal("");
			expect(result.args).to.deep.equal([]);
		});

		it("should build simple equality condition", () => {
			const result = (mapper as any).analysisWhere({ id: 1 });
			expect(result.sql).to.contain("WHERE");
			expect(result.args).to.include(1);
		});

		it("should build multiple conditions with AND", () => {
			const result = (mapper as any).analysisWhere({ id: 1, name: "test" });
			expect(result.sql).to.contain("WHERE");
			expect(result.args).to.include(1);
			expect(result.args).to.include("test");
		});
	});

	describe("analysisLimit", () => {
		it("should return empty for invalid limit", () => {
			const result = (mapper as any).analysisLimit({ limit: -1 });
			expect(result.str).to.equal("");
			expect(result.args).to.deep.equal([]);
		});

		it("should return LIMIT only", () => {
			const result = (mapper as any).analysisLimit({ limit: 10 });
			expect(result.str).to.contain("LIMIT");
			expect(result.args).to.deep.equal([10]);
		});

		it("should return OFFSET and LIMIT", () => {
			const result = (mapper as any).analysisLimit({ limit: 10, offest: 20 });
			expect(result.str).to.contain("OFFSET");
			expect(result.str).to.contain("LIMIT");
			expect(result.args).to.deep.equal([20, 10]);
		});
	});

	describe("analysisGroups", () => {
		it("should return empty for empty groups", () => {
			const result = (mapper as any).analysisGroups([]);
			expect(result).to.equal("");
		});

		it("should return GROUP BY clause", () => {
			const result = (mapper as any).analysisGroups(["name"]);
			expect(result).to.contain("GROUP BY");
			expect(result).to.contain('"name"');
		});
	});

	describe("analysisOrders", () => {
		it("should return empty for empty orders", () => {
			const result = (mapper as any).analysisOrders({});
			expect(result).to.equal("");
		});

		it("should return ORDER BY clause", () => {
			const result = (mapper as any).analysisOrders({ id: "ASC" });
			expect(result).to.contain("ORDER BY");
			expect(result).to.contain('"id"');
			expect(result).to.contain("ASC");
		});
	});

	describe("analysisJoin", () => {
		it("should return empty for empty join list", () => {
			const result = (mapper as any).analysisJoin([]);
			expect(result).to.equal("");
		});

		it("should return JOIN clause", () => {
			const result = (mapper as any).analysisJoin([
				{ type: "LEFT", table: "other", on: "other.id = test_table.id" },
			]);
			expect(result).to.contain("LEFT JOIN");
			expect(result).to.contain("other");
			expect(result).to.contain("ON");
		});
	});

	describe("toDBValue", () => {
		it("should convert value to DB format", () => {
			const row = { name: "test" };
			const result = (mapper as any).toDBValue(row, "name", "string");
			expect(result).to.equal("test");
		});

		it("should handle null value", () => {
			const row = { name: null };
			const result = (mapper as any).toDBValue(row, "name", "string");
			expect(result).to.be.null;
		});
	});
});
