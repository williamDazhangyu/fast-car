import { expect } from "chai";
import SerializeUtil from "../../src/util/SerializeUtil";

describe("SerializeUtil", () => {
	describe("serialize", () => {
		it("should serialize string correctly", () => {
			const result = SerializeUtil.serialize("hello", "string");
			expect(result).to.equal("hello");
		});

		it("should serialize boolean true to 1", () => {
			const result = SerializeUtil.serialize(true, "boolean");
			expect(result).to.equal(1);
		});

		it("should serialize boolean false to 0", () => {
			const result = SerializeUtil.serialize(false, "boolean");
			expect(result).to.equal(0);
		});

		it("should serialize number correctly", () => {
			const result = SerializeUtil.serialize(123, "number");
			expect(result).to.equal(123);
		});

		it("should serialize float number correctly", () => {
			const result = SerializeUtil.serialize(123.456, "number");
			expect(result).to.equal(123.456);
		});

		it("should serialize json object correctly", () => {
			const obj = { a: 1, b: "test" };
			const result = SerializeUtil.serialize(obj, "json");
			expect(result).to.equal('{"a":1,"b":"test"}');
		});

		it("should serialize jsonb object correctly", () => {
			const obj = { a: 1, b: "test" };
			const result = SerializeUtil.serialize(obj, "jsonb");
			expect(result).to.equal('{"a":1,"b":"test"}');
		});

		it("should return json string as is", () => {
			const jsonStr = '{"a":1}';
			const result = SerializeUtil.serialize(jsonStr, "json");
			expect(result).to.equal('{"a":1}');
		});

		it("should serialize vector from array", () => {
			const arr = [1.1, 2.2, 3.3];
			const result = SerializeUtil.serialize(arr, "vector");
			expect(result).to.equal("[1.1,2.2,3.3]");
		});

		it("should serialize vector from Float32Array", () => {
			const arr = new Float32Array([1.1, 2.2, 3.3]);
			const result = SerializeUtil.serialize(arr, "vector");
			expect(result).to.equal("[1.100000023841858,2.200000047683716,3.299999952316284]");
		});

		it("should serialize vector with dimensions from array", () => {
			const arr = [1, 2, 3];
			const result = SerializeUtil.serialize(arr, "vector(3)");
			expect(result).to.equal("[1,2,3]");
		});

		it("should serialize vector with dimensions from Float32Array", () => {
			const arr = new Float32Array([1, 2, 3]);
			const result = SerializeUtil.serialize(arr, "vector(3)");
			expect(result).to.equal("[1,2,3]");
		});

		it("should serialize Float32Array type", () => {
			const arr = new Float32Array([1, 2, 3]);
			const result = SerializeUtil.serialize(arr, "Float32Array");
			expect(result).to.equal("[1,2,3]");
		});

		it("should serialize object typed value when dbType is vector(3)", () => {
			const arr = new Float32Array([1, 2, 3]);
			const result = SerializeUtil.serialize(arr, "object", "vector(3)");
			expect(result).to.equal("[1,2,3]");
		});

		it("should return null for null value", () => {
			const result = SerializeUtil.serialize(null, "string");
			expect(result).to.be.null;
		});

		it("should return null for undefined value", () => {
			const result = SerializeUtil.serialize(undefined, "string");
			expect(result).to.be.null;
		});

		it("should serialize unknown type as JSON", () => {
			const obj = { test: "value" };
			const result = SerializeUtil.serialize(obj, "unknown");
			expect(result).to.equal('{"test":"value"}');
		});

		it("should serialize array as JSON for unknown type", () => {
			const arr = [1, 2, 3];
			const result = SerializeUtil.serialize(arr, "custom");
			expect(result).to.equal("[1,2,3]");
		});
	});
});
