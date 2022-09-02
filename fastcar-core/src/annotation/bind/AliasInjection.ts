import { CommonConstant } from "../../constant/CommonConstant";
import FastCarApplication from "../../FastCarApplication";

/***
 * @version 1.0 根据别名注入依赖
 *
 */
export default function AliasInjection(alias: string) {
	return function (target: any, propertyKey: string) {
		Reflect.defineProperty(target, propertyKey, {
			get: () => {
				let app: FastCarApplication = Reflect.get(global, CommonConstant.FastcarApp);

				if (!app.hasComponentByName(alias)) {
					//找不到依赖组件异常
					let injectionError = new Error(`Unsatisfied dependency expressed through [${propertyKey}] `);
					throw injectionError;
				}

				return app.getComponentByName(alias);
			},
		});
	};
}
