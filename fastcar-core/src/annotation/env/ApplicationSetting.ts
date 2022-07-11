import { CommonConstant } from "../../constant/CommonConstant";
import FastCarApplication from "../../FastCarApplication";
//应用程序设置 具有最高权限
export default function ApplicationSetting(setting: { [key: string]: any }) {
	return function (target: any) {
		let fastcarSetting: Map<string, any> = Reflect.getMetadata(CommonConstant.FastcarSetting, FastCarApplication.prototype);
		if (!fastcarSetting) {
			fastcarSetting = new Map<string, any>();
		}
		Object.keys(setting).forEach((key) => {
			let afterConfig = setting[key];
			let beforeConfig = fastcarSetting.get(key);
			if (beforeConfig) {
				if (typeof beforeConfig == "object") {
					afterConfig = Object.assign(beforeConfig, afterConfig);
				}
			}

			fastcarSetting.set(key, afterConfig);
		});

		Reflect.defineMetadata(CommonConstant.FastcarSetting, fastcarSetting, FastCarApplication.prototype);
	};
}
