//延迟注入作用用于类上,用于没有初始时的依赖注入
import { CommonConstant } from "../../constant/CommonConstant";
import { FastCarMetaData } from "../../constant/FastCarMetaData";
import { ClassConstructor } from "../../type/ClassConstructor";
import ClassUtils from "../../utils/ClassUtils";

export default function DemandInjection(Target: ClassConstructor<any>) {
	const proxy = new Proxy(Target, {
		construct: (Target: ClassConstructor<any>, args: any, newTarget?: any) => {
			let c = Reflect.construct(Target, args, newTarget);
			let app: any = Reflect.get(global, CommonConstant.FastcarApp);

			app?.loadInjectionService(c);
			app?.loadLoggerIOC(c);

			let hotter = Reflect.getMetadata(FastCarMetaData.HotterFilePath, Target.prototype);
			if (!!hotter) {
				let fp = Reflect.getMetadata(FastCarMetaData.HotterFilePath, Target.prototype);
				if (!!fp) {
					//启用监听
					app?.addClassHot(fp, c, Target.name);
				}
			}

			return c;
		},
	});

	ClassUtils.cloneMetadata(Target, proxy);
	return proxy;
}
