import { EnableScheduling, ScheduledCron, ScheduledInterval } from "../src/Scheduling";

describe("定时器测试", () => {
	it("定时器间隔测试", () => {
		@EnableScheduling
		class TimerTest {
			hello: string;

			constructor() {
				this.hello = "aaa";
			}

			@ScheduledInterval({ fixedRate: 1000, initialDelay: 1 })
			run() {
				console.log(this.hello);
			}
		}

		let t = new TimerTest();
	});

	it("定时器cron", () => {
		@EnableScheduling
		class TimerTest {
			hello: string;

			constructor() {
				this.hello = "bbb";
			}

			@ScheduledCron({ cron: "*/1 * * * * *" })
			run() {
				console.log(this.hello);
			}
		}

		let t = new TimerTest();
	});

	it("定时器销毁测试", () => {
		@EnableScheduling
		class TimerTest {
			hello: string;

			constructor() {
				this.hello = "ccc";
			}

			@ScheduledInterval({ fixedRate: 1000, initialDelay: 1 })
			run(diff: number, stop?: boolean) {
				console.log(this.hello);
			}
		}

		let t = new TimerTest();

		setTimeout(() => {
			console.log("销毁定时器");
			t.run(0, true);
		}, 2000);

		setTimeout(() => {
			console.log("开启定时器");
			t.run(0, false);
		}, 5000);
	});
});
