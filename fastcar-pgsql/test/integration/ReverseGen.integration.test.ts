import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import ReverseGenerate from "../../src/util/ReverseGen";

describe("ReverseGenerate Integration Tests", () => {
	const outputDir = path.join(__dirname, "..", "tmp", "reverse-gen");
	const modelDir = path.join(outputDir, "model");
	const mapperDir = path.join(outputDir, "mapper");
	const dbConfig = {
		host: "localhost",
		user: "postgres",
		password: "123456",
		port: 5432,
		database: "test",
	};

	beforeEach(() => {
		fs.rmSync(outputDir, { recursive: true, force: true });
	});

	after(async () => {
		fs.rmSync(outputDir, { recursive: true, force: true });
		for (let handle of (process as any)._getActiveHandles()) {
			if (handle && handle !== process.stdout && handle !== process.stderr && handle !== process.stdin && typeof (handle as any).unref == "function") {
				(handle as any).unref();
			}
		}
	});

	it("should generate model and mapper for public schema table", async () => {
		await ReverseGenerate.generator({
			tables: ["test"],
			modelDir,
			mapperDir,
			dbConfig,
			schema: "public",
		});

		const modelFile = path.join(modelDir, "Test.ts");
		const mapperFile = path.join(mapperDir, "TestMapper.ts");

		expect(fs.existsSync(modelFile)).to.be.true;
		expect(fs.existsSync(mapperFile)).to.be.true;

		const modelContent = fs.readFileSync(modelFile, "utf8");
		expect(modelContent).to.contain('@Table("test")');
		expect(modelContent).to.contain("@PrimaryKey");
	});

	it("should generate model and mapper for custom schema via schema option", async () => {
		await ReverseGenerate.generator({
			tables: ["test_reverse_gen"],
			modelDir,
			mapperDir,
			dbConfig,
			schema: "custom",
		});

		const modelFile = path.join(modelDir, "TestReverseGen.ts");
		const mapperFile = path.join(mapperDir, "TestReverseGenMapper.ts");

		expect(fs.existsSync(modelFile)).to.be.true;
		expect(fs.existsSync(mapperFile)).to.be.true;

		const modelContent = fs.readFileSync(modelFile, "utf8");
		expect(modelContent).to.contain('@Table("custom.test_reverse_gen")');
		expect(modelContent).to.contain("@PrimaryKey");
		expect(modelContent).to.contain("主键ID");
		expect(modelContent).to.contain("负载数据");
	});

	it("should generate model and mapper for schema qualified table name", async () => {
		await ReverseGenerate.generator({
			tables: ["custom.test_reverse_gen"],
			modelDir,
			mapperDir,
			dbConfig,
		});

		const modelFile = path.join(modelDir, "TestReverseGen.ts");
		const mapperFile = path.join(mapperDir, "TestReverseGenMapper.ts");

		expect(fs.existsSync(modelFile)).to.be.true;
		expect(fs.existsSync(mapperFile)).to.be.true;

		const mapperContent = fs.readFileSync(mapperFile, "utf8");
		expect(mapperContent).to.contain("class TestReverseGenMapper");
	});

	it("should throw for non-existing table", async () => {
		try {
			await ReverseGenerate.generator({
				tables: ["custom.not_exists_table"],
				modelDir,
				mapperDir,
				dbConfig,
			});
			expect.fail("should have thrown");
		} catch (e: any) {
			expect(e.message).to.contain("The table does not exist or is empty");
		}
	});
});
