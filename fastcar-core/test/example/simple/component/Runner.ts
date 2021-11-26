import ApplicationStart from "../../../../src/annotation/lifeCycle/ApplicationStart";
import ApplicationRunnerService from "../../../../src/interface/ApplicationRunnerService";

//启动示例
@ApplicationStart
export default class Runner implements ApplicationRunnerService {
	run() {
		console.info("ApplicationStart is Run");
	}
}
