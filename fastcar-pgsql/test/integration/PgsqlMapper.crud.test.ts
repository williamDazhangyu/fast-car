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

describe("PgsqlMapper CRUD Tests", () => {
	let mapper: CrudTestMapper;
	let testId: number;

	before(async () => {
		mapper = appInstance.app.getComponentByTarget<CrudTestMapper>(CrudTestMapper)!;

		for (let handle of (process as any)._getActiveHandles()) {
			if (handle && handle !== process.stdout && handle !== process.stderr && handle !== process.stdin && typeof (handle as any).unref == "function") {
				(handle as any).unref();
			}
		}
		
		// 清理测试数据
		try {
			await mapper.delete({ where: {} });
		} catch (e) {
			// 忽略清理错误
		}
	});

	describe("save operations", () => {
		it("should save one record and return id", async () => {
			const entity = new CrudTest({
				name: "test-save-one",
				value: 100,
				createdAt: new Date(),
			});
			
			const id = await mapper.saveOne(entity);
			expect(id).to.be.greaterThan(0);
			testId = id;
		});

		it("should save list of records", async () => {
			const entities = [
				new CrudTest({ name: "test-list-1", value: 1, createdAt: new Date() }),
				new CrudTest({ name: "test-list-2", value: 2, createdAt: new Date() }),
			];
			
			const result = await mapper.saveList(entities);
			expect(result).to.be.true;
		});

		it("should reject empty list", async () => {
			try {
				await mapper.saveList([]);
				expect.fail("should have thrown");
			} catch (e: any) {
				expect(e.message).to.contain("rows is empty");
			}
		});
	});

	describe("select operations", () => {
		it("should select by condition", async () => {
			const results = await mapper.select({
				where: { name: "test-save-one" },
			});
			
			expect(results.length).to.be.greaterThan(0);
			expect(results[0].name).to.equal("test-save-one");
		});

		it("should select one record", async () => {
			const result = await mapper.selectOne({
				where: { name: "test-save-one" },
			});
			
			expect(result).to.not.be.null;
			expect(result?.name).to.equal("test-save-one");
		});

		it("should select by primary key", async () => {
			const entity = new CrudTest({ id: testId });
			const result = await mapper.selectByPrimaryKey(entity);
			
			expect(result).to.not.be.null;
			expect(result?.id).to.equal(testId);
		});

		it("should return empty array for non-existing condition", async () => {
			const results = await mapper.select({
				where: { name: "non-existing-name" },
			});
			
			expect(results).to.deep.equal([]);
		});
	});

	describe("update operations", () => {
		it("should update by condition", async () => {
			const result = await mapper.update({
				where: { name: "test-list-1" },
				row: { value: 999 },
			});
			
			expect(result).to.be.true;
		});

		it("should update one record", async () => {
			const result = await mapper.updateOne({
				where: { name: "test-list-2" },
				row: { value: 888 },
				orders: { id: OrderEnum.asc },
			});
			
			expect(result).to.be.true;
		});

		it("should update by primary key", async () => {
			const entity = new CrudTest({
				id: testId,
				name: "updated-name",
				value: 777,
			});
			
			const result = await mapper.updateByPrimaryKey(entity);
			expect(result).to.be.true;
		});
	});

	describe("delete operations", () => {
		it("should delete by condition", async () => {
			// 先插入一条数据
			const entity = new CrudTest({
				name: "to-delete",
				value: 1,
				createdAt: new Date(),
			});
			await mapper.saveOne(entity);
			
			const result = await mapper.delete({
				where: { name: "to-delete" },
			});
			
			expect(result).to.be.true;
		});

		it("should delete one record", async () => {
			const result = await mapper.deleteOne({ name: "test-list-1" });
			expect(result).to.be.true;
		});
	});

	describe("utility operations", () => {
		it("should check exist", async () => {
			const exists = await mapper.exist({ name: "updated-name" });
			expect(exists).to.be.true;
		});

		it("should check not exist", async () => {
			const exists = await mapper.exist({ name: "non-existing" });
			expect(exists).to.be.false;
		});

		it("should count records", async () => {
			const count = await mapper.count({});
			expect(count).to.be.greaterThanOrEqual(0);
		});

		it("should count with condition", async () => {
			const count = await mapper.count({ name: "updated-name" });
			expect(count).to.be.greaterThanOrEqual(0);
		});
	});

	after(async () => {
		// 清理测试数据
		try {
			await mapper.delete({ where: {} });
		} catch (e) {
			// 忽略清理错误
		}
		appInstance.app.stopServer();
	});
});
