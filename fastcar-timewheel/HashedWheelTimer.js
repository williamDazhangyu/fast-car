"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @version 1.0 构造一个时间轮均匀分布以便处理定时任务
 */
class HashedWheelTimer {
    slots; // 时间槽数组（链表存储任务）
    tickDuration; // 槽位时间间隔（如 100ms）
    _currentTick = 0; // 当前指针位置
    wheelSize; // 时间轮大小（如 512）
    slotMaxSize; //卡槽最大数量
    nextRoundTimers;
    /**
     * @param tickDuration 每个轮的间隔时间
     * @param wheelSize 时间轮大小 总时长为:tickDuration * wheelSize
     * @param slotMaxSize 最大槽位处理数量 当每次tick的时候只取这个数量以下的 超过的放在下一轮处理
     *
     */
    constructor({ tickDuration, wheelSize, slotMaxSize }) {
        this.wheelSize = wheelSize;
        this.tickDuration = tickDuration;
        this.slots = new Array(this.wheelSize).fill(null).map(() => new Set());
        this.slotMaxSize = slotMaxSize;
        this.nextRoundTimers = new Array(this.wheelSize).fill(null).map(() => []);
    }
    addId(id, timer) {
        let ticks = Math.ceil(timer / this.tickDuration);
        let targetSlot = (this._currentTick + ticks) % this.wheelSize;
        if (ticks >= this.wheelSize) {
            this.nextRoundTimers[targetSlot].push({
                key: id,
                cycle: Math.floor(ticks / this.wheelSize) + 1,
            });
        }
        else {
            this.slots[targetSlot].add(id);
        }
        return targetSlot;
    }
    /**
     *
     * @version 1.0 通常和时间心跳配合使用，负责tick的下一步
     */
    tick() {
        let ctick = this._currentTick;
        this._currentTick = (ctick + 1) % this.wheelSize;
        let tmpSlots = this.slots[ctick];
        //将之前下一轮的放入进来
        if (this.nextRoundTimers[ctick].length > 0) {
            this.nextRoundTimers[ctick] = this.nextRoundTimers[ctick].filter((item) => {
                item.cycle--;
                if (item.cycle > 0) {
                    return true;
                }
                tmpSlots.add(item.key);
                return false;
            });
        }
        if (tmpSlots.size == 0) {
            return null;
        }
        let ids = [...tmpSlots.values()];
        tmpSlots.clear();
        let useIds = ids.splice(0, this.slotMaxSize);
        if (ids.length > 0) {
            ids.forEach((id) => {
                this.addId(id, 0); //过渡到下一轮中
            });
        }
        return useIds;
    }
    removeId(id, slotId) {
        if (!this.slots[slotId].delete(id)) {
            if (this.nextRoundTimers[slotId].length > 0) {
                let index = this.nextRoundTimers[slotId].findIndex((item) => {
                    return item.key == id;
                });
                if (index != -1) {
                    this.nextRoundTimers[slotId].splice(index, 1);
                }
            }
        }
    }
    get currentTick() {
        return this._currentTick;
    }
}
exports.default = HashedWheelTimer;
