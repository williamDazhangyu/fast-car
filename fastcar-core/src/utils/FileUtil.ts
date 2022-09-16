import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { SYSConfig, SYSDefaultConfig } from "../config/SysConfig";
import { CommonConstant, FileResSuffix } from "../constant/CommonConstant";
import MixTool from "./Mix";

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
						if (Reflect.has(require.cache, fp)) {
							Reflect.deleteProperty(require.cache, fp);
						}

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

	//获取加载配置项
	static getApplicationConfig(resPath: string, configName: string, sysConfig: SYSConfig = SYSDefaultConfig): SYSConfig {
		const replaceSetting = (property: string, fileContent: object) => {
			let addConfig = Reflect.get(fileContent, property);
			if (addConfig) {
				let currConfig = Reflect.get(sysConfig, property);
				Reflect.deleteProperty(fileContent, property);
				if (CommonConstant.Settings == property) {
					Object.keys(addConfig).forEach((key) => {
						let afterConfig = addConfig[key];
						let beforeConfig = sysConfig.settings.get(key);
						if (beforeConfig) {
							//对settings的属性进行覆盖
							if (typeof beforeConfig == "object") {
								afterConfig = Object.assign(beforeConfig, afterConfig);
							}
						}
						sysConfig.settings.set(key, afterConfig);
					});
				} else {
					Object.assign(currConfig, addConfig);
				}
			}
		};

		FileResSuffix.forEach((suffix) => {
			let fileContent = FileUtil.getResource(path.join(resPath, `${configName}.${suffix}`));
			if (fileContent) {
				replaceSetting(CommonConstant.Settings, fileContent);

				replaceSetting(CommonConstant.Application, fileContent);

				//将application和sesstings进行删除
				Reflect.deleteProperty(fileContent, CommonConstant.Application);
				Reflect.deleteProperty(fileContent, CommonConstant.Settings);

				//追加自定的属性
				MixTool.copyProperties(sysConfig, fileContent);
			}
		});

		return sysConfig;
	}
}
