import { LifeCycleModule } from "../../constant/LifeCycleModule";
import Component from "../stereotype/Component";

//在应用启动后触发
export default function ApplicationStart(target: any) {
	if (!Reflect.has(target.prototype, "run")) {
		throw new Error(`${target.name} has no implementation run method`);
	}
	Component(target);
	Reflect.defineMetadata(LifeCycleModule.ApplicationStart, true, target.prototype);
}
