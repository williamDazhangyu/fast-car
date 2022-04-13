import { CommonConstant } from "../../constant/CommonConstant";
import FastCarApplication from "../../FastCarApplication";
import Logger from "../../interface/Logger";

//日志实例
export default function Log(category?: string) {
	return function (target: any, propertyKey: string) {
		let m = category || propertyKey;

		Reflect.defineProperty(target, propertyKey, {
			get: (): Logger => {
				let app: FastCarApplication = Reflect.get(global, CommonConstant.FastcarApp);
				return app ? app.getLogger(m) : console;
			},
		});
	};
}
