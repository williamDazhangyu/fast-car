import { TimeUnit } from "../src/ConstantTime";
import { Heartbeat } from "../src/HeartBeat";

describe("定时器测试", () => {
	it("定时任务测试，一般用于动态任务", () => {
		let interval = new Heartbeat({ fixedRate: 1, fixedRateString: TimeUnit.second });
		interval.start(() => {
			console.log("我是一个间隔定时器");
		}, this);

		setTimeout(() => {
			interval.stop();
			console.log("定时器销毁");
		}, 10000);
	});
});
