/***
 * @version 1.0 进行约定
 *
 */
export default interface SchedulingService {
	scheduledModule: Map<string, any>; //存放预计划
	timerModule: Map<string, any>; //存放已开启的计划

	removeTimer(methodName: string): void; //移除启动的定时任务
}
