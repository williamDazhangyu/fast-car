import Service from "../../../../src/annotation/stereotype/Service";
import Logger from "../../../../src/interface/Logger";
import Log from "../../../../src/annotation/stereotype/Log";

//日志测试实例
@Service
class LogService {
	@Log()
	private logger!: Logger;

	info() {
		this.logger.info("自定义的日志输出");
		this.logger.debug("自定义调试");
		this.logger.warn("自定义警告");
		this.logger.error("自定义报错");
	}
}

export default LogService;
