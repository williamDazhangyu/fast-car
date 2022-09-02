import { CommonConstant } from "../../constant/CommonConstant";
import FastCarApplication from "../../FastCarApplication";
import ReflectUtil from "../../utils/ReflectUtil";

/***
 * @version 1.0 在使用该函数时进行调用 声明的类可以不是组件
 *
 */
export default function CallDependency(target: any, propertyKey: string) {
	Reflect.defineProperty(target, propertyKey, {
		get: () => {
			let key = ReflectUtil.getNameByPropertyKey(target, propertyKey);
			let app: FastCarApplication = Reflect.get(global, CommonConstant.FastcarApp);

			if (!app.hasComponentByName(key)) {
				//找不到依赖组件异常
				let injectionError = new Error(`Unsatisfied dependency expressed through [${propertyKey}] `);
				throw injectionError;
			}

			return app.getComponentByName(key);
		},
	});
}
