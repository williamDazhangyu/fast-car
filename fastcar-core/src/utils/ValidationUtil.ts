import { DataTypes } from "../constant/DataTypes";
import FormatStr from "./FormatStr";
import TypeUtil from "./TypeUtil";
//类型校验器
export default class ValidationUtil {
	//是否为空
	static isNotNull(param: any): boolean {
		if (param != undefined && param != null) {
			if (TypeUtil.isString(param)) {
				return param.length > 0;
			}

			if (TypeUtil.isObject(param)) {
				if (TypeUtil.isDate(param)) {
					return true;
				}
				return Reflect.ownKeys(param).length > 0;
			}

			return true;
		} else {
			return false;
		}
	}

	static isNull(param: any): boolean {
		return !ValidationUtil.isNotNull(param);
	}

	static isNumber(param: any): boolean {
		return typeof param === "number" && !isNaN(param);
	}

	static isString(param: any): boolean {
		return typeof param === "string";
	}

	static isBoolean(param: any): boolean {
		return typeof param === "boolean";
	}

	static isDate(param: any): boolean {
		return param instanceof Date;
	}

	static isObject(param: any): boolean {
		return typeof param == "object";
	}

	// poaram >= value
	static isNotMinSize(param: any, value: number): boolean {
		if (ValidationUtil.isString(param)) {
			return param.length >= value;
		}

		if (ValidationUtil.isNumber(param)) {
			return param >= value;
		}

		if (ValidationUtil.isBoolean(param)) {
			return true;
		}

		let v = ValidationUtil.isNotNull(param) ? param.toString() : "";
		return v.length >= value;
	}

	static isNotMaxSize(param: any, value: number): boolean {
		return !ValidationUtil.isNotMinSize(param, value + 1);
	}

	static isArray(param: any, type: string): boolean {
		if (!Array.isArray(param)) {
			return false;
		}

		let UpType = FormatStr.formatFirstToUp(type);
		let m = `is${UpType}`;

		//如果没有该方法 则返回true
		if (!Reflect.has(ValidationUtil, m)) {
			return true;
		}

		let checkFun = Reflect.get(ValidationUtil, m);
		return param.every(item => {
			return Reflect.apply(checkFun, ValidationUtil, [item]);
		});
	}

	static getCheckFun(type: DataTypes | string): Function | null {
		//判定类型
		if (type.startsWith("array")) {
			return ValidationUtil.isArray;
		}

		let formatFun = null;
		switch (type) {
			case "string": {
				formatFun = ValidationUtil.isString;
				break;
			}
			case "boolean": {
				formatFun = ValidationUtil.isBoolean;
				break;
			}
			case "object": {
				formatFun = ValidationUtil.isObject;
				break;
			}
			case "int":
			case "float":
			case "number": {
				formatFun = ValidationUtil.isNumber;
				break;
			}
			case "date": {
				formatFun = ValidationUtil.isDate;
				break;
			}
			default: {
				break;
			}
		}

		return formatFun;
	}

	static checkType(param: any, type: string): boolean {
		let formatFun = ValidationUtil.getCheckFun(type);

		if (!formatFun) {
			return false;
		}

		return Reflect.apply(formatFun, ValidationUtil, [param, type]);
	}
}
