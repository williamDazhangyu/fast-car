import { CommonConstant } from "../../constant/CommonConstant";

//设置初始化的env 注入在原始的application上面
export default function ENV(name: string) {
	return function(target: any) {
		Reflect.set(target.prototype, CommonConstant.ENV, name);
	};
}
