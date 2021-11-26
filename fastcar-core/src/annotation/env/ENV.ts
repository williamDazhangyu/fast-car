import "reflect-metadata";
import { CommonConstant } from "../../constant/CommonConstant";
import FastCarApplication from "../../service/FastCarApplication";

//设置初始化的env 注入在原始的application上面
export function ENV(name: string) {
	return function(target: any) {
		Reflect.defineMetadata(CommonConstant.ENV, name, FastCarApplication.prototype);
	};
}
