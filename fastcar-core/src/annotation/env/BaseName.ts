import { CommonConstant } from "../../constant/CommonConstant";

export default function BaseName(name: string) {
	return function (target: any) {
		Reflect.set(target.prototype, CommonConstant.BaseName, name);
	};
}
