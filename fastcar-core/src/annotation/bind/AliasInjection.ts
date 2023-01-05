import { CommonConstant } from "../../constant/CommonConstant";
import ApplicationInterface from "../../interface/ApplicationInterface";

/***
 * @version 1.0 根据别名注入依赖
 *
 */
export default function AliasInjection(alias: string) {
	return function (target: any, propertyKey: string) {
		Reflect.defineProperty(target, propertyKey, {
			get: () => {
				let app: ApplicationInterface = Reflect.get(global, CommonConstant.FastcarApp);

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
