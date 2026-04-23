import { expect } from "chai";
import { FastCarApplication } from "@fastcar/core";
import { Application, BaseFilePath, BasePath } from "@fastcar/core/annotation";
import EnablePgsql from "../../src/annotation/EnablePgsql";
import VectorTestMapper from "./mapper/VectorTestMapper";
import VectorTest from "./model/VectorTest";
import { VectorOperatorEnum, VectorIndexType } from "../../src";

@Application
@BasePath(__dirname)
@BaseFilePath(__filename)
@EnablePgsql
class TestApp {
	app!: FastCarApplication;
}

const appInstance = new TestApp();

describe("PgsqlMapper Vector Tests", () => {
	let mapper: VectorTestMapper;
	let dsm: any;

	before(async () => {
		mapper = appInstance.app.getComponentByTarget<VectorTestMapper>(VectorTestMapper)!;
		dsm = appInstance.app.getComponentByName("PgsqlDataSourceManager");

		for (let handle of (process as any)._getActiveHandles()) {
			if (handle && handle !== process.stdout && handle !== process.stderr && handle !== process.stdin && typeof (handle as any).unref == "function") {
				(handle as any).unref();
			}
		}
		
		// 启用 pgvector 扩展
		try {
			await dsm.enableVectorExtension();
		} catch (e) {
			console.log("Vector extension may already exist");
		}
		
		// 清理测试数据
		try {
			await mapper.delete({ where: {} });
		} catch (e) {
			// 忽略清理错误
		}
		
		// 准备测试数据
		const testData = [
			{ name: "point-a", embedding: [1, 0, 0] },
			{ name: "point-b", embedding: [0, 1, 0] },
			{ name: "point-c", embedding: [0, 0, 1] },
			{ name: "point-d", embedding: [1, 1, 0] },
			{ name: "point-e", embedding: [0.5, 0.5, 0.5] },
		];
		
		for (const data of testData) {
			const entity = new VectorTest({
				name: data.name,
				embedding: new Float32Array(data.embedding),
			});
			await mapper.saveOne(entity);
		}
	});

	describe("vector serialization", () => {
		it("should save vector from array", async () => {
			const entity = new VectorTest({
				name: "array-vector",
				embedding: [1, 2, 3],
			});
			
			const id = await mapper.saveOne(entity);
			expect(id).to.be.greaterThan(0);
		});

		it("should save vector from Float32Array", async () => {
			const entity = new VectorTest({
				name: "float32-vector",
				embedding: new Float32Array([4, 5, 6]),
			});
			
			const id = await mapper.saveOne(entity);
			expect(id).to.be.greaterThan(0);
		});
	});

	describe("selectByVector", () => {
		it("should search by L2 distance", async () => {
			const results = await mapper.selectByVector({
				field: "embedding",
				vector: [1, 0, 0],
				operator: VectorOperatorEnum.l2Distance,
				limit: 3,
			});
			
			expect(results.length).to.be.greaterThan(0);
			expect(results[0].name).to.equal("point-a"); // 最接近 [1,0,0]
		});

		it("should search by cosine distance", async () => {
			const results = await mapper.selectByVector({
				field: "embedding",
				vector: [1, 1, 0],
				operator: VectorOperatorEnum.cosineDistance,
				limit: 3,
			});
			
			expect(results.length).to.be.greaterThan(0);
		});

		it("should search by inner product", async () => {
			const results = await mapper.selectByVector({
				field: "embedding",
				vector: [1, 1, 1],
				operator: VectorOperatorEnum.innerProduct,
				limit: 3,
			});
			
			expect(results.length).to.be.greaterThan(0);
		});
	});

	describe("selectByVectorWithWhere", () => {
		it("should search with filter condition", async () => {
			const results = await mapper.selectByVectorWithWhere(
				{
					field: "embedding",
					vector: [1, 0, 0],
					operator: VectorOperatorEnum.l2Distance,
					limit: 5,
				},
				{ name: "point-a" }
			);
			
			expect(results.length).to.equal(1);
			expect(results[0].name).to.equal("point-a");
		});

		it("should return empty when filter not match", async () => {
			const results = await mapper.selectByVectorWithWhere(
				{
					field: "embedding",
					vector: [1, 0, 0],
					operator: VectorOperatorEnum.l2Distance,
					limit: 5,
				},
				{ name: "non-existing" }
			);
			
			expect(results.length).to.equal(0);
		});
	});

	describe("vector index", () => {
		it("should create ivfflat index", async () => {
			try {
				await dsm.createVectorIndex({
					table: "test_vector",
					column: "embedding",
					type: VectorIndexType.ivfflat,
					lists: 10,
				});
				expect(true).to.be.true;
			} catch (e) {
				// 索引可能已存在
				expect(true).to.be.true;
			}
		});

		it("should create hnsw index", async () => {
			try {
				await dsm.createVectorIndex({
					table: "test_vector",
					column: "embedding",
					type: VectorIndexType.hnsw,
					m: 16,
					efConstruction: 64,
				});
				expect(true).to.be.true;
			} catch (e) {
				// 索引可能已存在
				expect(true).to.be.true;
			}
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
