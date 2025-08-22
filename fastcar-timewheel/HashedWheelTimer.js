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
    }
    addId(id, timer) {
        let ticks = Math.ceil(timer / this.tickDuration);
        let targetSlot = (this._currentTick + ticks) % this.wheelSize;
        this.slots[targetSlot].add(id);
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
        this.slots[slotId].delete(id);
    }
    get currentTick() {
        return this._currentTick;
    }
}
exports.default = HashedWheelTimer;
