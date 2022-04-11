import { CommonConstant } from "../../constant/CommonConstant";
import FastCarApplication from "../../FastCarApplication";

//日志实例
export default function Log(category?: string) {
	return function (target: any, propertyKey: string) {
		let m = category || propertyKey;

		Reflect.defineProperty(target, propertyKey, {
			get: () => {
				let app: FastCarApplication = Reflect.get(global, CommonConstant.FastcarApp);
				return app ? app.getLogger(m) : null;
			},
		});
	};
}
