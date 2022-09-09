import { CommonConstant } from "../../constant/CommonConstant";

export default function ResourcePath(name: string) {
	return function (target: any) {
		Reflect.set(target.prototype, CommonConstant.ResourcePath, name);
	};
}
