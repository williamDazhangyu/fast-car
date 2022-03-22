import { CommonConstant } from "../../constant/CommonConstant";
import * as fs from "fs";

//设置运行是的主路径
export default function BaseFilePath(name: string) {
	return function(target: any) {
		let stats = fs.statSync(name);
		if (stats.isFile()) {
			Reflect.set(target.prototype, CommonConstant.BaseFileName, name);
		}
	};
}
