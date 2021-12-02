import ApplicationStart from "../../../../src/annotation/lifeCycle/ApplicationStart";
import ApplicationRunnerService from "../../../../src/interface/ApplicationRunnerService";

//启动示例
@ApplicationStart
export default class StartRunner implements ApplicationRunnerService {
	run() {
		console.info("服务启动后调用的方法");
	}
}
