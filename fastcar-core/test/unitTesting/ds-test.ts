import DS from "../../src/annotation/data/DS";
import DSIndex from "../../src/annotation/data/DSIndex";

describe("数据源测试", () => {
	it("数据源类加载", () => {
		@DS("aa")
		class A {
			@DS("bb")
			test(@DSIndex zs?: string) {
				console.log(zs);
			}
		}

		let testA = new A();
		testA.test();
	});

	it("数据源继承加载影响", () => {
		class A {
			test(@DSIndex zs?: string) {
				console.log(zs);
			}
		}

		@DS("cc")
		class B extends A {
			test2() {}
		}

		let testB = new B();
		testB.test();
	});
});
