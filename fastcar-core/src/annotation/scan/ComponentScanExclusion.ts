import "reflect-metadata";
import * as path from "path";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

//和本包的相对路径
export default function ComponentScanExclusion(...names: string[]) {
	return function(target: any) {
		let ScanExcludePathList = FastCarMetaData.ComponentScanExclusion;
		let list: string[] = Reflect.getMetadata(ScanExcludePathList, target.prototype) || [];

		for (let name of names) {
			//转化成绝对路径
			let p = path.join(require.main?.path || "", name);
			if (!list.includes(p)) {
				list.push(p);
			}
		}

		Reflect.defineMetadata(ScanExcludePathList, list, target.prototype);
	};
}
