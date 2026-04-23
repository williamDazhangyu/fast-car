import { expect } from "chai";
import { FastCarApplication } from "@fastcar/core";
import { OrderEnum } from "@fastcar/core/db";
import { Application, BaseFilePath, BasePath } from "@fastcar/core/annotation";
import EnablePgsql from "../../src/annotation/EnablePgsql";
import CrudTestMapper from "./mapper/CrudTestMapper";
import CrudTest from "./model/CrudTest";

@Application
@BasePath(__dirname)
@BaseFilePath(__filename)
@EnablePgsql
class TestApp {
	app!: FastCarApplication;
}

const appInstance = new TestApp();

describe("PgsqlMapper Complex Query Tests", () => {
	let mapper: CrudTestMapper;
	let dsm: any;

	before(async () => {
		mapper = appInstance.app.getComponentByTarget<CrudTestMapper>(CrudTestMapper)!;
		dsm = appInstance.app.getComponentByName("PgsqlDataSourceManager");

		for (let handle of (process as any)._getActiveHandles()) {
			if (handle && handle !== process.stdout && handle !== process.stderr && handle !== process.stdin && typeof (handle as any).unref == "function") {
				(handle as any).unref();
			}
		}
		
		// 清理测试数据
		try {
			await mapper.delete({ where: {} });
		} catch (e) {
			// 忽略
		}
		
		// 准备测试数据
		const testData = [
			{ name: "apple", value: 10 },
			{ name: "banana", value: 20 },
			{ name: "cherry", value: 30 },
			{ name: "date", value: 40 },
			{ name: "elderberry", value: 50 },
		];
		
		for (const data of testData) {
			const entity = new CrudTest({
				name: data.name,
				value: data.value,
				createdAt: new Date(),
			});
			await mapper.saveOne(entity);
		}
	});

	describe("where conditions", () => {
		it("should query with multiple conditions", async () => {
			const results = await mapper.select({
				where: {
					name: "apple",
					value: 10,
				},
			});
			
			expect(results.length).to.equal(1);
			expect(results[0].name).to.equal("apple");
		});

		it("should query with OR condition", async () => {
			const results = await mapper.select({
				where: {
					OR: {
						name: "apple",
						value: 20,
					},
				},
			});
			
			expect(results.length).to.be.greaterThan(0);
		});

		it("should query with IN operator", async () => {
			const results = await mapper.select({
				where: {
					name: ["apple", "banana", "cherry"],
				},
			});
			
			expect(results.length).to.equal(3);
		});

		it("should query with comparison operators", async () => {
			const results = await mapper.select({
				where: {
					value: { ">=": 30 },
				},
				orders: { value: OrderEnum.asc },
			});
			
			expect(results.length).to.equal(3); // cherry, date, elderberry
			expect(results[0].value).to.equal(30);
		});

		it("should query with LIKE operator", async () => {
			const results = await mapper.select({
				where: {
					name: { LIKE: "%a%" },
				},
			});
			
			// apple, banana, date, elderberry 都包含 'a'
			expect(results.length).to.be.greaterThanOrEqual(3);
		});
	});

	describe("ordering and pagination", () => {
		it("should order by ASC", async () => {
			const results = await mapper.select({
				orders: { value: OrderEnum.asc },
				limit: 3,
			});
			
			expect(results.length).to.equal(3);
			expect(results[0].value).to.be.lessThanOrEqual(results[1].value);
		});

		it("should order by DESC", async () => {
			const results = await mapper.select({
				orders: { value: OrderEnum.desc },
				limit: 3,
			});
			
			expect(results.length).to.equal(3);
			expect(results[0].value).to.be.greaterThanOrEqual(results[1].value);
		});

		it("should support limit", async () => {
			const results = await mapper.select({
				limit: 2,
			});
			
			expect(results.length).to.equal(2);
		});

		it("should support limit and offset", async () => {
			const page1 = await mapper.select({
				orders: { value: OrderEnum.asc },
				limit: 2,
				offest: 0,
			});
			
			const page2 = await mapper.select({
				orders: { value: OrderEnum.asc },
				limit: 2,
				offest: 2,
			});
			
			expect(page1.length).to.equal(2);
			expect(page2.length).to.equal(2);
			expect(page1[0].value).to.not.equal(page2[0].value);
		});
	});

	describe("field selection", () => {
		it("should select specific fields", async () => {
			const results = await mapper.selectByCustom({
				fields: ["id", "name"],
				limit: 1,
			});
			
			expect(results[0]).to.have.property("id");
			expect(results[0]).to.have.property("name");
			// value 应该未被查询
		});
	});

	describe("batch operations", () => {
		it("should execute batch operations", async () => {
			const tasks = [
				{ sql: "INSERT INTO test_crud (name, value) VALUES (?, ?)", args: ["batch-1", 100] },
				{ sql: "INSERT INTO test_crud (name, value) VALUES (?, ?)", args: ["batch-2", 200] },
			];
			
			const result = await dsm.batchExecute(tasks);
			expect(result).to.be.true;
			
			// 验证数据
			const records = await mapper.select({
				where: { name: ["batch-1", "batch-2"] },
			});
			expect(records.length).to.equal(2);
		});

		it("should rollback on batch error", async () => {
			const tasks = [
				{ sql: "INSERT INTO test_crud (name, value) VALUES (?, ?)", args: ["rollback-test", 999] },
				{ sql: "INSERT INTO non_existent_table VALUES (?)", args: [1] }, // 会失败
			];
			
			const result = await dsm.batchExecute(tasks);
			expect(result).to.be.false;
			
			// 验证第一条数据被回滚
			const records = await mapper.select({
				where: { name: "rollback-test" },
			});
			expect(records.length).to.equal(0);
		});
	});

	describe("custom query", () => {
		it("should execute custom SQL", async () => {
			const result = await mapper.execute(
				"SELECT * FROM test_crud WHERE name = ?",
				["apple"]
			);
			
			expect(result.rowCount).to.equal(1);
		});

		it("should execute custom query", async () => {
			const result = await mapper.query(
				"SELECT * FROM test_crud WHERE value > ? ORDER BY value",
				[20]
			);
			
			expect(result.rows.length).to.be.greaterThan(0);
		});
	});

	after(async () => {
		// 清理测试数据
		try {
			await mapper.delete({ where: {} });
		} catch (e) {
			// 忽略
		}
		appInstance.app.stopServer();
	});
});
