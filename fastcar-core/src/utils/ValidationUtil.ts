import { DataTypes } from "../constant/DataTypes";
import TypeUtil from "./TypeUtil";

const NumberRegex = /^[0-9]+$/;

//类型校验器
export default class ValidationUtil {
	//是否为空
	static isNotNull(param: any): boolean {
		if (param != undefined && param != null) {
			if (TypeUtil.isString(param)) {
				return param.length > 0;
			}

			if (TypeUtil.isObject(param)) {
				if (TypeUtil.isDate(param) || TypeUtil.isMap(param) || TypeUtil.isSet(param)) {
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

	//修改数字的判断方法
	static isNumber(param: any): boolean {
		return NumberRegex.test(param);
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

		//修正数组的判断
		if (Array.isArray(param)) {
			return param.length >= value;
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

		//修正校验数组的错误
		if (type.startsWith("array")) {
			type = type.replace(/array/, "");
		}

		let checkFun: any = this.getCheckFun(type);
		if (checkFun) {
			return param.every((item) => {
				return Reflect.apply(checkFun, ValidationUtil, [item]);
			});
		}

		return true;
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
