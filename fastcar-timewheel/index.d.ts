/**
 * @version 1.0 构造一个时间轮均匀分布以便处理定时任务
 */
export class HashedWheelTimer<T> {
	private slots: Array<Set<T>>; // 时间槽数组（链表存储任务）
	private tickDuration: number; // 槽位时间间隔（如 100ms）
	private _currentTick: number; // 当前指针位置
	private wheelSize: number; // 时间轮大小（如 512）
	private slotMaxSize: number; //卡槽最大数量

	constructor({ tickDuration, wheelSize, slotMaxSize }: { tickDuration: number; wheelSize: number; slotMaxSize: number });

	addId(id: T, timer: number): number;

	/**
	 *
	 * @version 1.0 通常和时间心跳配合使用，负责tick的下一步
	 */
	tick(): T[] | null;

	removeId(id: T, slotId: number): void;

	get currentTick(): number;
}
