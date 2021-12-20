import Autowired from "../../../../src/annotation/Autowired";
import Controller from "../../../../src/annotation/stereotype/Controller";
import HelloConfig from "../config/HelloConfig";
import HelloService from "../service/HelloService";
import LogService from "../service/LogService";
import FastCarApplication from "../../../../src/FastCarApplication";

@Controller
class HelloController {
	@Autowired
	private hello!: HelloService;

	@Autowired
	private logService!: LogService;

	@Autowired
	private helloConfig!: HelloConfig;

	@Autowired
	private app!: FastCarApplication;

	callHello() {
		this.hello.say();
	}

	print() {
		this.logService.info();
	}

	getConfig() {
		return this.helloConfig.hello;
	}

	getApp() {
		return this.app;
	}
}

export default HelloController;
