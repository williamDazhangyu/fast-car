import { Autowired, Log, Service } from "../../../src/annotation";
import Logger from "../../../src/interface/Logger";
import AService from "./aService";

@Service
export default class BService {
	@Autowired
	a!: AService;

	@Log()
	logger!: Logger;

	sayHello() {
		// let aa = this.app.getComponentByTarget(AService);
		// aa.sayHello();
		this.a.sayHello();
	}
}
