import { BootPriority } from "../../constant/BootPriority";
import { LifeCycleModule } from "../../constant/LifeCycleModule";
import { AddLifeCycleItem } from "./AddLifeCycleItem";

//启动时机
export default function ApplicationDestory(order: number = BootPriority.Sys) {
	return function (target: any, method: string, value: any) {
		AddLifeCycleItem(target, LifeCycleModule.ApplicationStop, {
			order,
			exec: method,
		});
	};
}
