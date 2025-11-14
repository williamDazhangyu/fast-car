"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
/**
 * @version 1.0 采用轮询机制对文件的修改时间进行检测
 */
class WatchFile {
    fsMap = new Map(); //文件路径 - 检测时间
    timerId;
    pollInterval;
    notifyTime;
    constructor({ pollInterval, notifyTime }) {
        this.pollInterval = pollInterval;
        this.notifyTime = notifyTime;
        this.loop();
    }
    addWatch({ fp, context, eventName, }) {
        if (this.fsMap.has(fp)) {
            return;
        }
        this.fsMap.set(fp, {
            time: Date.now(),
            context,
            eventName,
        });
    }
    getFsCount() {
        return this.fsMap.size;
    }
    loop() {
        const self = this;
        clearTimeout(self.timerId);
        let nowTime = Date.now();
        this.fsMap.forEach((item, fp) => {
            if (nowTime - item.time < this.notifyTime) {
                return;
            }
            if (fs.existsSync(fp)) {
                let fitem = fs.statSync(fp);
                if (fitem.isFile()) {
                    let m = fitem.mtime.getTime();
                    let diffTime = m - item.time;
                    if (diffTime >= this.notifyTime) {
                        item.context.emit(item.eventName, fp);
                        item.time = m;
                    }
                }
            }
        });
        self.timerId = setTimeout(async () => {
            self.loop();
        }, this.pollInterval);
    }
}
exports.default = WatchFile;
