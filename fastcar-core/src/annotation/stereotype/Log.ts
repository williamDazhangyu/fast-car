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
				let appid = app.getSetting(CommonConstant.APPId) || ""; //进行差异化区分
				return app ? app.getLogger(appid ? `[${appid}] ${m}` : m) : console;
			},
		});
	};
}
