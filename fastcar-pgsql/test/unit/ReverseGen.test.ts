import "reflect-metadata";
import { expect } from "chai";
import * as sinon from "sinon";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as pg from "pg";
import ReverseGenerate from "../../src/util/ReverseGen";

const noopStyle = {
	tabWidth: 4,
	printWidth: 200,
	trailingComma: "es5" as const,
	useTabs: true,
	parser: "typescript" as const,
};

describe("ReverseGenerate", () => {
	afterEach(() => {
		sinon.restore();
	});

	describe("helper methods", () => {
		it("should format class name from plain table name", () => {
			expect(ReverseGenerate.formatClassName("test_table")).to.equal("TestTable");
		});

		it("should format class name from schema qualified table name", () => {
			expect(ReverseGenerate.formatClassName("custom.test_table")).to.equal("TestTable");
		});

		it("should parse table info with default schema", () => {
			expect(ReverseGenerate.parseTableInfo("test_table", "public")).to.deep.equal({
				schema: "public",
				tableName: "test_table",
				fullName: "test_table",
			});
		});

		it("should parse table info from schema qualified name", () => {
			expect(ReverseGenerate.parseTableInfo("custom.test_table", "public")).to.deep.equal({
				schema: "custom",
				tableName: "test_table",
				fullName: "custom.test_table",
			});
		});

		it("should create nested directory recursively", () => {
			const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "reverse-gen-dir-"));
			const targetDir = path.join(baseDir, "a", "b", "c");

			ReverseGenerate.createDir(targetDir);

			expect(fs.existsSync(targetDir)).to.be.true;
			expect(fs.statSync(targetDir).isDirectory()).to.be.true;

			fs.rmSync(baseDir, { recursive: true, force: true });
		});
	});

	describe("generator", () => {
		it("should throw when table list is empty", async () => {
			try {
				await ReverseGenerate.generator({
					tables: [],
					modelDir: "model",
					mapperDir: "mapper",
					dbConfig: {},
				});
				expect.fail("should have thrown");
			} catch (e: any) {
				expect(e.message).to.equal("table is empty");
			}
		});

		it("should rethrow query error and close connection", async () => {
			const connectStub = sinon.stub(pg.Client.prototype, "connect").resolves();
			const queryStub = sinon.stub(pg.Client.prototype, "query").rejects(new Error("query failed"));
			const endStub = sinon.stub(pg.Client.prototype, "end").resolves();

			const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "reverse-gen-fail-"));
			const modelDir = path.join(baseDir, "model");
			const mapperDir = path.join(baseDir, "mapper");

			try {
				await ReverseGenerate.generator({
					tables: ["test"],
					modelDir,
					mapperDir,
					dbConfig: {},
					style: noopStyle,
				});
				expect.fail("should have thrown");
			} catch (e: any) {
				expect(e.message).to.equal("query failed");
			}

			expect(connectStub.calledOnce).to.be.true;
			expect(queryStub.called).to.be.true;
			expect(endStub.calledOnce).to.be.true;

			fs.rmSync(baseDir, { recursive: true, force: true });
		});

		it("should use schema from parameter when querying", async () => {
			sinon.stub(pg.Client.prototype, "connect").resolves();
			const endStub = sinon.stub(pg.Client.prototype, "end").resolves();
			const queryStub = sinon.stub(pg.Client.prototype, "query");

			queryStub.onFirstCall().resolves({
				rows: [
					{
						column_name: "id",
						column_comment: "主键ID",
						data_type: "bigint",
						column_default: "nextval('test_id_seq'::regclass)",
						is_nullable: "NO",
						character_maximum_length: null,
						numeric_precision: 64,
						numeric_scale: null,
					},
				],
			} as any);
			queryStub.onSecondCall().resolves({
				rows: [{ column_name: "id", constraint_type: "PRIMARY KEY" }],
			} as any);

			const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "reverse-gen-schema-"));
			const modelDir = path.join(baseDir, "model", "nested");
			const mapperDir = path.join(baseDir, "mapper", "nested");

			await ReverseGenerate.generator({
				tables: ["test_reverse_gen"],
				modelDir,
				mapperDir,
				dbConfig: {},
				schema: "custom",
				style: noopStyle,
			});

			expect(queryStub.firstCall.args[1]).to.deep.equal(["custom", "test_reverse_gen"]);
			expect(queryStub.secondCall.args[1]).to.deep.equal(["custom", "test_reverse_gen"]);
			expect(fs.existsSync(path.join(modelDir, "TestReverseGen.ts"))).to.be.true;
			expect(fs.existsSync(path.join(mapperDir, "TestReverseGenMapper.ts"))).to.be.true;
			expect(endStub.calledOnce).to.be.true;

			fs.rmSync(baseDir, { recursive: true, force: true });
		});
	});
});
