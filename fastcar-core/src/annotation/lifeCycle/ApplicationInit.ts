import { BootPriority } from "../../constant/BootPriority";
import { LifeCycleModule } from "../../constant/LifeCycleModule";
import { AddLifeCycleItem } from "./AddLifeCycleItem";

//启动时机
export default function ApplicationInit(order: number = BootPriority.Sys) {
	return function (target: any, method: string, value: any) {
		AddLifeCycleItem(target, LifeCycleModule.ApplicationStart, {
			order,
			exec: method,
		});
	};
}
