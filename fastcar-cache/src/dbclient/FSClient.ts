import { Item } from "../CacheType";
import DBClientService from "./DBClientService";
import * as fs from "fs";
import * as path from "path";

export default class FSClient<T> implements DBClientService<T> {
	private filepath: string;

	constructor(filepath: string) {
		this.filepath = filepath;

		let dirpath = filepath.split(path.sep);
		dirpath.pop();
		let dir = dirpath.join(path.sep);

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
	}

	async mget(): Promise<Item<T>[]> {
		let list = fs.readFileSync(this.filepath).toString();
		let object = JSON.parse(list);

		if (!object) {
			return [];
		}

		return Object.keys(object).map((key) => {
			return {
				key,
				value: object[key],
				ttl: 0,
			};
		});
	}

	async mset(list: Item<T>[]): Promise<boolean> {
		if (list.length == 0) {
			return true;
		}
		let nlist = fs.readFileSync(this.filepath).toString();
		let object = {};

		try {
			object = JSON.parse(nlist);
		} catch (e) {
			console.error(e);
		}

		let afterObject = {};
		list.forEach((item) => {
			Reflect.set(afterObject, item.key, item.value);
		});

		Object.assign(object, afterObject);
		fs.writeFileSync(this.filepath, JSON.stringify(object));

		return true;
	}

	async mdelete(keys: string[]): Promise<boolean> {
		let nlist = fs.readFileSync(this.filepath).toString();
		let object = JSON.parse(nlist) || {};

		if (Object.keys(object).length == 0) {
			return true;
		}

		keys.forEach((key) => {
			Reflect.deleteProperty(object, key);
		});

		fs.writeFileSync(this.filepath, JSON.stringify(object));
		return true;
	}
}
