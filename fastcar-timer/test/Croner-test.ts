import { describe } from "mocha";
import { Cron } from "croner";
import DateUtil from "../../fastcar-core/src/utils/DateUtil";

describe("croner", () => {
	it("查看最近的次数", () => {
		const nextSundays = new Cron("0 0 0 * * 7").enumerate(100);
		nextSundays.forEach((item) => {
			console.log("最近一百次的结果", DateUtil.toDateTime(item));
		});
	});
	it("生命周期", () => {
		const test1: Cron = new Cron("* * * * * *");
		setTimeout(() => {
			test1.stop();
		}, 10000);

		setTimeout(() => {
			test1.schedule(() => {
				console.log("运行时间", DateUtil.toDateTime());
			});
		}, 2000);
	});
});
