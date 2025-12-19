import { TimeUnit } from "../../src";
import { ScheduledInterval } from "../../src/Scheduling2";

export default class Root {
	protected name = "root";

	@ScheduledInterval({ fixedRate: 1, fixedRateString: TimeUnit.second })
	loop() {
		console.log(`定时循环-----`, this.name);
	}
}
