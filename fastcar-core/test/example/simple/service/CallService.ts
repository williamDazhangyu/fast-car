import HelloService from "./HelloService";
import CallDependency from "../../../../src/annotation/bind/CallDependency";
import DemandInjection from "../../../../src/annotation/bind/DemandInjection";

@DemandInjection
export default class CallService {
	@CallDependency
	private hello!: HelloService;

	sayHello() {
		return this.hello.say();
	}
}
