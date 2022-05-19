import { BootPriority } from "../../constant/BootPriority";
import { LifeCycleModule } from "../../constant/LifeCycleModule";
import { AddLifeCycleItem } from "./AddLifeCycleItem";
import ApplicationRunner from "./ApplicationRunner";

//在应用停止前触发
export default function ApplicationStop(order: number = BootPriority.Sys, exec: string = "run") {
	return function (target: any) {
		if (!Reflect.has(target.prototype, exec)) {
			throw new Error(`${target.name} has no implementation ${exec} method`);
		}
		ApplicationRunner(target);
		AddLifeCycleItem(target.prototype, LifeCycleModule.ApplicationStop, {
			order,
			exec,
		});
	};
}
