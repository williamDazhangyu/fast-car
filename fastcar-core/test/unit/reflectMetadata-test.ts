import Autowired from "../../src/annotation/Autowired";
import "reflect-metadata";

class Test {}

describe("装饰器元数据测试", () => {
	it("元数据测试案例", () => {
		class A {
			@Reflect.metadata(undefined, undefined)
			hello!: Test;
		}

		let s = Reflect.getMetadata("design:type", A.prototype, "hello");
		console.log();
	});
});
