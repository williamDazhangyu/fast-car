import "reflect-metadata";
import * as path from "path";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

export function ComponentScan(...names: string[]) {
	return function(target: any) {
		let ScanPathList = FastCarMetaData.ComponentScan;
		let list: string[] = Reflect.getMetadata(ScanPathList, target.prototype) || [];

		for (let name of names) {
			//转化成绝对路径
			let p = path.join(require.main?.path || "", name);
			if (!list.includes(p)) {
				list.push(p);
			}
		}

		Reflect.defineMetadata(ScanPathList, list, target.prototype);
	};
}
