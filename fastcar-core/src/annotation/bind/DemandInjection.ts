//延迟注入作用用于类上,用于没有初始时的依赖注入
import { CommonConstant } from "../../constant/CommonConstant";
import { ClassConstructor } from "../../type/ClassConstructor";

export default function DemandInjection(Target: ClassConstructor<any>) {
	return new Proxy(Target, {
		construct: (Target: ClassConstructor<any>, args: any, newTarget?: any) => {
			let c = Reflect.construct(Target, args, newTarget);
			let app: any = Reflect.get(global, CommonConstant.FastcarApp);

			app?.loadInjectionService(c);
			app?.loadLoggerIOC(c);
			return c;
		},
	});
}
