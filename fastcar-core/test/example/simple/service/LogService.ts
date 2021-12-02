import Autowired from "../../../../src/annotation/Autowired";
import Service from "../../../../src/annotation/stereotype/Service";
import Logger from "../../../../src/interface/Logger";

//日志测试实例
@Service
class LogService {
	@Autowired
	private logger!: Logger;

	info() {
		console.info("123");
		this.logger.info("自定义的日志输出");
	}
}

export default LogService;
