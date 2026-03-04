import { CommonConstant } from "../../constant/CommonConstant";
import { FastCarMetaData } from "../../constant/FastCarMetaData";
import FastCarApplication from "../../FastCarApplication";
import { ClassConstructor } from "../../type/ClassConstructor";
import ClassUtils from "../../utils/ClassUtils";

export default function DemandInjection(Target: ClassConstructor<any>) {
	const proxy = new Proxy(Target, {
		construct: (Target: ClassConstructor<any>, args: any, newTarget: any) => {
			let hotter = Reflect.getMetadata(FastCarMetaData.HotterFilePath, Target.prototype);
			let fp = Reflect.getMetadata(FastCarMetaData.HotterFilePath, Target.prototype);
			let app: FastCarApplication = Reflect.get(global, CommonConstant.FastcarApp);

			if (hotter) {
				if (fp) {
					let currTarget = app.getDemandTarget(fp, Target.name);
					if (currTarget) {
						newTarget = currTarget;
					}
				}
			}

			let instance = Reflect.construct(Target, args, newTarget);

			// 依赖注入
			app?.loadInjectionService(instance);
			app?.loadLoggerIOC(instance);

			if (hotter) {
				if (fp) {
					app?.addClassHot(fp, instance, Target.name);
				}
			}

			return instance;
		},
	});

	ClassUtils.cloneMetadata(Target, proxy);
	return proxy;
}
