import "reflect-metadata";
import * as path from "path";
import * as fs from "fs";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

//和本包的相对路径
export default function ComponentScanExclusion(...names: string[]) {
	return function (target: any) {
		let ScanPathList = FastCarMetaData.ComponentScanExclusion;
		let list: string[] = Reflect.get(target.prototype, ScanPathList) || [];

		for (let name of names) {
			//可支持绝对路径
			let p = path.join(require.main?.path || "", name);
			if (fs.existsSync(name)) {
				p = name;
			}

			if (!list.includes(p)) {
				list.push(p);
			}
		}

		Reflect.set(target.prototype, ScanPathList, list);
	};
}
