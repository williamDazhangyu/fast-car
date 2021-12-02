import ApplicationStart from "../../src/annotation/lifeCycle/ApplicationStart";
import RunnerService from "../../src/interface/ApplicationRunnerService";

@ApplicationStart
class RunnerServiceImpl implements RunnerService {
	run() {}
}

let a = new RunnerServiceImpl();
console.log(a);
