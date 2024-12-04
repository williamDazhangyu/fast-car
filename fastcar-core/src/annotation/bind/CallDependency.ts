import { InjectionType } from "../../type/ComponentDesc";
import { AddInjectionService } from "./AddInjectionService";

/***
 * @version 1.0 在使用该函数时进行调用 声明的类可以不是组件
 *
 */
export default function CallDependency(target: Object, propertyKey: string) {
	AddInjectionService({
		target,
		propertyKey,
		kind: InjectionType.PROPERTYKEY,
	});
}
