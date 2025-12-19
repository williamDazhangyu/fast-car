import { TimeUnit } from "../../src";
import { EnableScheduling, ScheduledInterval } from "../../src/Scheduling2";
import Root from "./Root";

@EnableScheduling
export default class ChildB extends Root {
	name = "B";

	@ScheduledInterval({ fixedRate: 1, fixedRateString: TimeUnit.second })
	loop2(diff: number) {
		console.log(`定时循环-----2`, diff);
	}
}
