import "reflect-metadata";
import * as path from "path";
import * as fs from "fs";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

//和本包的相对路径
export default function ComponentScanMust(...names: string[]) {
	return function (target: any) {
		let scanMust = FastCarMetaData.ComponentScanMust;
		let list: string[] = Reflect.get(target.prototype, scanMust) || [];

		for (let name of names) {
			//可支持绝对路径
			let p = path.join(require.main?.path || process.cwd() || "", name);
			if (fs.existsSync(name)) {
				p = name;
			}

			if (!list.includes(p)) {
				list.push(p);
			}
		}

		Reflect.set(target.prototype, scanMust, list);
	};
}
