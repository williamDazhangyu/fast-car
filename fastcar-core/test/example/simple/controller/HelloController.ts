import Autowired from "../../../../src/annotation/Autowired";
import Controller from "../../../../src/annotation/stereotype/Controller";
import HelloConfig from "../config/HelloConfig";
import HelloService from "../service/HelloService";
import LogService from "../service/LogService";

@Controller
class HelloController {
	@Autowired
	private hello!: HelloService;

	@Autowired
	private logService!: LogService;

	@Autowired
	private helloConfig!: HelloConfig;

	callHello() {
		this.hello.say();
	}

	print() {
		this.logService.info();
	}

	getConfig() {
		return this.helloConfig.hello;
	}
}

export default HelloController;
