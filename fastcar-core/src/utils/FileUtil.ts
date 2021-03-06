import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

const fileResSuffix = ["json", "yml", "js"]; //文件资源后缀名
const bytesUnit = ["B", "K", "M", "G"];

export default class FileUtil {
	/***
	 * @version 1.0 获取文件路径
	 *
	 */
	static getFilePathList(filePath: string): string[] {
		let pathList: string[] = Array.of();

		let existFlag = fs.existsSync(filePath);
		if (!existFlag) {
			return pathList;
		}

		let currStats = fs.statSync(filePath);
		let cfile = currStats.isFile();
		let cdir = currStats.isDirectory();

		if (!cdir && !cfile) {
			return pathList;
		}

		if (cfile) {
			pathList.push(filePath);
			return pathList;
		}

		let childPaths = fs.readdirSync(filePath);
		for (let c of childPaths) {
			let fullPath = path.join(filePath, c);
			let tmpStats = fs.statSync(fullPath);

			if (tmpStats.isDirectory()) {
				let childPaths = FileUtil.getFilePathList(fullPath);
				if (childPaths.length > 0) {
					pathList = [...pathList, ...childPaths];
				}
			} else if (tmpStats.isFile()) {
				pathList.push(fullPath);
			}
		}

		return pathList;
	}

	/***
	 * @version 1.0 获取后缀名
	 *
	 */
	static getSuffix(filePath: string): string {
		let lastIndex = filePath.lastIndexOf(".") + 1;
		if (lastIndex <= 0) {
			return "";
		}
		let suffix = filePath.substring(lastIndex);
		return suffix;
	}

	/***
	 * @version 1.0 获取文件的文件名
	 */
	static getFileName(filePath: string): string {
		let pList = filePath.split(path.sep);
		let lastPath = pList[pList.length - 1];
		let lastName = lastPath.split(".");

		return lastName[0];
	}

	//加载配置文件
	static getResource(fp: string): object | null {
		let currSuffix = FileUtil.getSuffix(fp);
		if (!fileResSuffix.includes(currSuffix)) {
			return null;
		}

		if (fs.existsSync(fp)) {
			let currStats = fs.statSync(fp);
			if (currStats.isFile()) {
				//进行解析
				let content = fs.readFileSync(fp, "utf-8");
				switch (currSuffix) {
					case "yml": {
						return yaml.parse(content);
					}
					case "json": {
						return JSON.parse(content);
					}
					case "js":
					case "ts": {
						return require(fp);
					}
					default: {
						return null;
					}
				}
			}
		}

		return null;
	}

	//格式化字节大小
	static formatBytes(n: number): string {
		for (let i = 0; i < bytesUnit.length; i++) {
			let nn = n / Math.pow(1024, i);
			if (nn <= 1024) {
				return `${nn.toFixed(2)}(${bytesUnit[i]})`;
			}
		}

		let maxL = bytesUnit.length - 1;
		return `${(n / Math.pow(1024, maxL)).toFixed(2)}(${bytesUnit[maxL]})`;
	}
}
