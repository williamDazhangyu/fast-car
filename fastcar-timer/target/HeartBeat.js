"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heartbeat = void 0;
const nodeCron = require("node-cron");
const ConstantTime_1 = require("./ConstantTime");
class Heartbeat {
    constructor({ fixedRate = 1000, fixedRateString = ConstantTime_1.TimeUnit.millisecond, initialDelay = 0, cron, timezone = "Asia/Shanghai" }) {
        this.status = false;
        this.timezone = timezone;
        //优先采用cron
        if (cron) {
            //默认为cron格式
            let valid = nodeCron.validate(cron);
            if (!valid) {
                throw new Error(`this corn: ${cron} is invalid`);
            }
            this.cron = cron;
            this.originalConfig = {
                initialDelay,
                cron,
                timezone,
            };
        }
        else {
            //开启间隔时长模式
            this.interval = this.getInterval(fixedRate, fixedRateString);
            this.initialDelay = initialDelay;
            this.originalConfig = {
                fixedRate,
                fixedRateString,
                initialDelay,
            };
        }
    }
    //获取间隔时长
    getInterval(fixedRate = 1000, fixedRateString = ConstantTime_1.TimeUnit.millisecond) {
        let inteval = ConstantTime_1.TimeUnitNum[fixedRateString];
        return fixedRate * inteval;
    }
    //开启任务
    start(fn, context) {
        const self = this;
        self.lastTime = Date.now();
        if (this.cron) {
            let task = nodeCron.schedule(this.cron, () => {
                self.diff = Date.now() - self.lastTime;
                self.lastTime = Date.now();
                Reflect.apply(fn, context, [self.diff]);
            }, {
                scheduled: false,
                timezone: this.timezone,
            });
            this.task = task;
            this.timerId = setTimeout(() => {
                task.start();
            }, this.initialDelay);
        }
        else {
            self.pacemaker(fn, context, this.initialDelay);
        }
    }
    pacemaker(fn, context, delay = this.interval) {
        const self = this;
        clearTimeout(self.timerId);
        if (!self.status) {
            self.lastTime = Date.now();
            self.timerId = setTimeout(async () => {
                let timeStamp = Date.now();
                self.diff = timeStamp - self.lastTime;
                self.lastTime = timeStamp;
                try {
                    Reflect.apply(fn, context, [self.diff]);
                }
                catch (e) {
                    console.error("error", e);
                }
                self.pacemaker(fn, context);
            }, delay);
        }
    }
    stop() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            Reflect.deleteProperty(this, "timerId");
        }
        if (Reflect.has(this, "task")) {
            this.task.stop();
            Reflect.deleteProperty(this, "task");
        }
        this.status = true;
    }
    getStatus() {
        return this.status;
    }
    getConfig() {
        return this.originalConfig;
    }
}
exports.Heartbeat = Heartbeat;
