import FileUtil from "./FileUtil";

export default class TypeUtil {
	static isFunction(f: any): boolean {
		let typeName = typeof f;
		return typeName == "function";
	}

	static isClass(f: any): boolean {
		if (f.prototype === undefined) {
			return false;
		}

		if (!f.prototype.constructor) {
			return false;
		}

		return true;
	}

	static isString(str: any): boolean {
		let typeName = typeof str;
		return typeName == "string";
	}

	static isObject(f: any): boolean {
		let typeName = typeof f;
		return typeName == "object";
	}

	static isTSORJS(fp: string): boolean {
		let suffix = FileUtil.getSuffix(fp);
		return ["ts", "js"].includes(suffix);
	}

	static isPromise(f: Function) {
		return f.constructor.name === "AsyncFunction";
	}
}
