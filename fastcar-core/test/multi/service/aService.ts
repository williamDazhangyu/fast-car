import { Autowired, Log, Service } from "../../../src/annotation";
import Logger from "../../../src/interface/Logger";
import BService from "./bService";

@Service
export default class AService {
	@Log()
	logger!: Logger;

	@Autowired
	b!: BService;

	sayHello() {
		this.logger.debug("a---");
	}
}
