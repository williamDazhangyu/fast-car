import { ApplicationStart } from '../base/decorators/LifeCycle';
import RunnerService from '../base/interface/ApplicationRunnerService';

@ApplicationStart
class RunnerServiceImpl implements RunnerService {

    run() {

    }
}

Reflect.get(RunnerServiceImpl, "applicationStart");
RunnerServiceImpl.name

let a = new RunnerServiceImpl();
console.log(a);