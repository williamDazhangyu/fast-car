import { LifeCycleModule } from "../../constant/LifeCycleModule";
import { BootPriority } from "../../constant/BootPriority";

export type LifeCycleType = {
	order: BootPriority;
	exec: string;
};

export function AddLifeCycleItem(target: any, lifeCycle: LifeCycleModule, item: LifeCycleType) {
	let list: LifeCycleType[] = Reflect.getMetadata(lifeCycle, target);
	if (!list) {
		list = [];
	}

	let exist = list.some((fitem) => {
		return item.exec == fitem.exec;
	});

	if (exist) {
		return;
	}

	list.push(item);
	Reflect.defineMetadata(lifeCycle, list, target);
}
