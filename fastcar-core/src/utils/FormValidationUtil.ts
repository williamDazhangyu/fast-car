import Format from "./Format";
import TypeUtil from "./TypeUtil";
//表单校验器
export class FormValidationUtil {
	//是否为空
	static isNotNull(param: any) {
		if (param != undefined && param != null) {
			if (TypeUtil.isString(param)) {
				return param != "" && param != "";
			}

			if (TypeUtil.isObject(param)) {
				return Reflect.ownKeys(param).length > 0;
			}

			return true;
		} else {
			return false;
		}
	}

	static isNull(param: any) {
		return !FormValidationUtil.isNotNull(param);
	}

	static isNumber(param: any) {
		return typeof param === "number";
	}

	static isString(param: any) {
		return typeof param === "string";
	}

	static isBoolean(param: any) {
		return typeof param === "boolean";
	}

	static isDate(param: any) {
		return param instanceof Date;
	}

	static isNotMaxSize(param: any, value: number) {
		if (FormValidationUtil.isString(param)) {
			return param.length <= value;
		}

		if (FormValidationUtil.isNumber(param)) {
			return param <= value;
		}

		if (FormValidationUtil.isBoolean(param)) {
			return true;
		}

		let v = FormValidationUtil.isNotNull(param) ? param.toString() : "";
		return v.length <= value;
	}

	static isNotMinSize(param: any, value: number) {
		if (FormValidationUtil.isString(param)) {
			return param.length >= value;
		}

		if (FormValidationUtil.isNumber(param)) {
			return param >= value;
		}

		if (FormValidationUtil.isBoolean(param)) {
			return true;
		}

		let v = FormValidationUtil.isNotNull(param) ? param.toString() : "";
		return v.length >= value;
	}

	static isArray(param: any, type: string) {
		if (!Array.isArray(param)) {
			return false;
		}

		let UpType = Format.formatFirstToUp(type);
		let m = `is${UpType}`;

		//如果没有该方法 则返回true
		if (!Reflect.has(FormValidationUtil, m)) {
			return true;
		}

		if (Reflect.has(FormValidationUtil, m)) {
			return param.every(item => {
				return Reflect.apply(Reflect.get(FormValidationUtil, m), FormValidationUtil, [item]);
			});
		}

		return false;
	}

	static checkType(param: any, type: string) {
		//判定类型
		if (type.startsWith("array")) {
			let ntype = type.replace(/array/, "");
			return FormValidationUtil.isArray(param, ntype);
		}

		let formatFun = null;
		switch (type) {
			case "string": {
				formatFun = FormValidationUtil.isString;
				break;
			}
			case "boolean": {
				formatFun = FormValidationUtil.isBoolean;
				break;
			}
			case "int":
			case "float":
			case "number": {
				formatFun = FormValidationUtil.isNumber;
				break;
			}
			case "date": {
				formatFun = FormValidationUtil.isDate;
				break;
			}
			default: {
				return true;
			}
		}

		return Reflect.apply(formatFun, FormValidationUtil, [param, type]);
	}
}
