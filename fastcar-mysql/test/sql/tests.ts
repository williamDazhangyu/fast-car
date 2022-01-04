import "reflect-metadata";

function SessionId(target: any, name: string, index: number) {
	console.log("调用次数----");
	Reflect.defineMetadata("sessionId", index, target, name);
}

function Transactional(target: any, name: string, descriptor: PropertyDescriptor) {
	let orignFunction = descriptor.value;
	descriptor.value = function (...args: any[]) {
		let sessionInfo = Reflect.getMetadata("sessionId", target, name);
		if (sessionInfo) {
			args[sessionInfo] = "123";
		}
		return Reflect.apply(orignFunction, this, args);
	};
}

class A {
	@Transactional
	word(a: string, c: string, @SessionId b?: string) {
		console.log(a, b, c);
	}
}
new A().word("1", "2");
