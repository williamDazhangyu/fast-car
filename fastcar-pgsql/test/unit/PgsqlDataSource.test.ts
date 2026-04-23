import { expect } from "chai";
import PgsqlDataSource from "../../src/dataSource/PgsqlDataSource";

describe("PgsqlDataSource", () => {
	describe("format", () => {
		it("should format SQL with values", () => {
			const sql = "SELECT * FROM test WHERE id = ? AND name = ?";
			const values = [1, "hello"];
			const result = PgsqlDataSource.format(sql, values);
			// 注意：format 方法对所有非关键字值都添加单引号
			expect(result).to.equal("SELECT * FROM test WHERE id = '1' AND name = 'hello'");
		});

		it("should format SQL with null value", () => {
			const sql = "INSERT INTO test VALUES (?, ?)";
			const values = [1, null];
			const result = PgsqlDataSource.format(sql, values);
			expect(result).to.equal("INSERT INTO test VALUES ('1', null)");
		});

		it("should format SQL with NULL value", () => {
			const sql = "INSERT INTO test VALUES (?, ?)";
			const values = [1, "NULL"];
			const result = PgsqlDataSource.format(sql, values);
			expect(result).to.equal("INSERT INTO test VALUES ('1', NULL)");
		});

		it("should format SQL with DEFAULT value", () => {
			const sql = "INSERT INTO test VALUES (?, ?)";
			const values = [1, "DEFAULT"];
			const result = PgsqlDataSource.format(sql, values);
			expect(result).to.equal("INSERT INTO test VALUES ('1', DEFAULT)");
		});

		it("should format SQL with undefined value", () => {
			const sql = "INSERT INTO test VALUES (?, ?)";
			const values = [1, undefined];
			const result = PgsqlDataSource.format(sql, values);
			expect(result).to.equal("INSERT INTO test VALUES ('1', undefined)");
		});

		it("should escape single quotes to prevent SQL injection", () => {
			const sql = "SELECT * FROM test WHERE name = ?";
			const values = ["'; DROP TABLE test; --"];
			const result = PgsqlDataSource.format(sql, values);
			// 使用双单引号进行 SQL 转义（标准 SQL 做法）
			expect(result).to.equal("SELECT * FROM test WHERE name = '''; DROP TABLE test; --'");
		});

		it("should format SQL without values", () => {
			const sql = "SELECT * FROM test";
			const result = PgsqlDataSource.format(sql, []);
			expect(result).to.equal("SELECT * FROM test");
		});
	});

	describe("replacePlaceholders", () => {
		it("should replace ? with $n", () => {
			const sql = "SELECT * FROM test WHERE id = ? AND name = ?";
			const args = [1, "hello"];
			const result = PgsqlDataSource.replacePlaceholders(sql, args);
			expect(result.sql).to.equal("SELECT * FROM test WHERE id = $1 AND name = $2");
			expect(result.args).to.deep.equal([1, "hello"]);
		});

		it("should return same SQL if no args", () => {
			const sql = "SELECT * FROM test";
			const args: any[] = [];
			const result = PgsqlDataSource.replacePlaceholders(sql, args);
			expect(result.sql).to.equal("SELECT * FROM test");
			expect(result.args).to.deep.equal([]);
		});

		it("should handle null value correctly", () => {
			const sql = "INSERT INTO test VALUES (?, ?)";
			const args = [1, null];
			const result = PgsqlDataSource.replacePlaceholders(sql, args);
			expect(result.sql).to.equal("INSERT INTO test VALUES ($1, null)");
			expect(result.args).to.deep.equal([1]);
		});

		it("should handle DEFAULT keyword", () => {
			const sql = "INSERT INTO test VALUES (?, ?)";
			const args = [1, "DEFAULT"];
			const result = PgsqlDataSource.replacePlaceholders(sql, args);
			expect(result.sql).to.equal("INSERT INTO test VALUES ($1, DEFAULT)");
			expect(result.args).to.deep.equal([1]);
		});

		it("should handle multiple null values", () => {
			const sql = "INSERT INTO test VALUES (?, ?, ?)";
			const args = [1, null, "test"];
			const result = PgsqlDataSource.replacePlaceholders(sql, args);
			expect(result.sql).to.equal("INSERT INTO test VALUES ($1, null, $2)");
			expect(result.args).to.deep.equal([1, "test"]);
		});
	});
});
