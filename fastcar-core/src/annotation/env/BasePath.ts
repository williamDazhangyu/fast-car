import { CommonConstant } from "../../constant/CommonConstant";
import * as fs from "fs";

//设置运行是的主路径
export default function BasePath(name: string) {
	return function(target: any) {
		let stats = fs.statSync(name);
		if (stats.isDirectory()) {
			Reflect.set(global, CommonConstant.BasePath, name);
		}
	};
}
