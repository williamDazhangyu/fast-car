import { BootPriority } from "../../constant/BootPriority";
import { LifeCycleModule } from "../../constant/LifeCycleModule";
import { AddLifeCycleItem } from "./AddLifeCycleItem";
import ApplicationRunner from "./ApplicationRunner";

/****
 * @version 1.0 在应用启动后自动执行
 * @params order 排序 序号越小排在越前面 系统级的组件 如数据库等一般为0
 * @params exec 执行方法
 */
export default function ApplicationStart(order: number = BootPriority.Sys, exec: string = "run") {
	return function (target: any) {
		if (!Reflect.has(target.prototype, exec)) {
			throw new Error(`${target.name} has no implementation ${exec} method`);
		}

		ApplicationRunner(target);
		AddLifeCycleItem(target.prototype, LifeCycleModule.ApplicationStart, {
			order,
			exec,
		});
	};
}
