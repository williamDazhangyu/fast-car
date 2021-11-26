import { LifeCycleModule } from "../../constant/LifeCycleModule";
import Component from "../stereotype/Component";

//在应用停止前触发
export default function ApplicationStop(target: any) {
	if (!Reflect.has(target.prototype, "run")) {
		throw new Error(`${target.name} has no implementation run method`);
	}
	Component(target);
	Reflect.defineMetadata(LifeCycleModule.ApplicationStop, true, target.prototype);
}
