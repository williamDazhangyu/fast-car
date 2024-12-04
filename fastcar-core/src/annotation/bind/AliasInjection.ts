import { InjectionType } from "../../type/ComponentDesc";
import { AddInjectionService } from "./AddInjectionService";

/***
 * @version 1.0 根据别名注入依赖
 *
 */
export default function AliasInjection(alias: string) {
	return function (target: Object, propertyKey: string) {
		AddInjectionService({
			target,
			propertyKey,
			alias,
			kind: InjectionType.ALIAS,
		});
	};
}
