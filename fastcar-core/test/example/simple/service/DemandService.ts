import DemandInjection from "../../../../src/annotation/bind/DemandInjection";
import HotterDemand from "../../../../src/annotation/scan/HotterDemand";

@HotterDemand(__filename)
@DemandInjection
export default class DemandService {
	sayHello() {
		return "hello";
	}
}
