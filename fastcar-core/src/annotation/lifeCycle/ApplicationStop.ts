import { LifeCycleModule } from "../../constant/LifeCycleModule";
import Component from "../stereotype/Component";

//在应用停止前触发
export default function ApplicationStop(order: number = 1, exec: string = "run") {
	return function(target: any) {
		if (!Reflect.has(target.prototype, exec)) {
			throw new Error(`${target.name} has no implementation ${exec} method`);
		}
		Component(target);
		Reflect.defineMetadata(
			LifeCycleModule.ApplicationStop,
			{
				order,
				exec,
			},
			target.prototype
		);
	};
}
