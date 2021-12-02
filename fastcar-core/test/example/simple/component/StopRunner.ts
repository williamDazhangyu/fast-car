import ApplicationStop from "../../../../src/annotation/lifeCycle/ApplicationStop";
import ApplicationRunnerService from "../../../../src/interface/ApplicationRunnerService";

@ApplicationStop
export default class StopRunner implements ApplicationRunnerService {
	async run() {
		return new Promise(resolve => {
			setTimeout(() => {
				console.info("服务停止前调用的方法");
				resolve("OK");
			}, 5000);
		});
	}
}
