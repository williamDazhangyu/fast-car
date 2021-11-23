import SchedulingService from "../base/interface/SchedulingService";
import { EnableScheduling, Scheduled, ScheduledInterval, ScheduledCron } from '../base/decorators/Scheduling';

describe('定时器测试', () => {

    it("定时器测试", () => {

        @EnableScheduling
        class TimerTest implements SchedulingService {

            hello: string;
            scheduledModule: Map<string, any>;
            timerModule: Map<string, any>;

            constructor() {

                this.hello = "aaa";
            }

            removeTimer(methodName: string): void {

            };

            @Scheduled({ fixedRate: 10000, initialDelay: 1 })
            run() {

                console.log(this.hello);
            };
        }


        let t = new TimerTest();
        //销毁对象
        setTimeout(() => {

            t.removeTimer("run");
        }, 2000);
    });

    it("定时器不实现接口说明测试", () => {

        @EnableScheduling
        class TimerTest {

            hello: string;

            constructor() {

                this.hello = "aaa";
            }

            @ScheduledInterval({ fixedRate: 1000, initialDelay: 1 })
            run() {

                console.log(this.hello);
            };
        }


        let t = new TimerTest();
        setTimeout(() => {

            Reflect.apply(t["removeTimer"], t, ["run"]);
        }, 2000);
    });

    it("定时器cron", () => {

        @EnableScheduling
        class TimerTest {

            hello: string;

            constructor() {

                this.hello = "aaa";
            }

            @ScheduledCron({ cron: "*/1 * * * * *" })
            run() {

                console.log(this.hello);
            };
        }

        let t = new TimerTest();
        setTimeout(() => {

            Reflect.apply(t["removeTimer"], t, ["run"]);
        }, 2000);
    });
});