import HelloService from "./HelloService";
import CallDependency from "../../../../src/annotation/bind/CallDependency";

export default class CallService {
	@CallDependency
	private hello!: HelloService;

	sayHello() {
		return this.hello.say();
	}
}
