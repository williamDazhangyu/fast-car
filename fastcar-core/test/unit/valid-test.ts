import "reflect-metadata";
import ValidForm from "../../src/annotation/valid/ValidForm";
import NotNull from "../../src/annotation/valid/NotNull";
import Size from "../../src/annotation/valid/Size";
import { Rule } from "../../src/annotation/valid/Rule";

describe("表单校验测试", () => {
	it("表单单个测试", () => {
		class A {
			//简单类型
			@ValidForm
			test(@Rule() @NotNull a?: string) {
				console.log(a);
			}
		}
		let instance = new A();
		instance.test("");
	});

	it("表单复合型测试", () => {
		type B = {
			c: string;
			d?: number;
		};
		class A {
			//简单类型
			@ValidForm
			test(
				@Rule({
					a: { required: true },
				})
				a: string,
				@Rule({
					c: { required: true },
					d: { type: "number", minSize: 1, maxSize: 10 },
				})
				b: B
			) {
				console.log(a, b);
			}
		}
		let instance = new A();
		instance.test("a", { c: "c", d: 6 }); // 校验通过
		instance.test("a", { c: "c", d: 13 }); //校验失败
	});

	it("表单类测试", () => {
		class B {
			@NotNull
			c!: string;
			@Size({ minSize: 1, maxSize: 10 })
			d?: number;
		}
		class A {
			//简单类型
			@ValidForm
			test(a: string, @Rule() @NotNull b: B) {
				console.log(a, b);
			}
		}
		let instance = new A();
		instance.test("a", { c: "c", d: 13 }); //校验失败
	});
});
