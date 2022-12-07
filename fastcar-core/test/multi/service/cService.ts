import { Autowired, Log, Service } from "../../../src/annotation";
import Logger from "../../../src/interface/Logger";
import BService from "./bService"; //如果a b颠倒则会出现 b调用a时无法找到依赖情况
import AService from "./aService";

@Service
export default class CService {
	@Log()
	logger!: Logger;

	@Autowired
	a!: AService;

	@Autowired
	b!: BService;

	test() {
		this.a.sayHello();
		this.b.sayHello();
	}
}
