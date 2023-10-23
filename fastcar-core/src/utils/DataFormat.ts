/***
 * @version 1.0 数据格式处理
 */
class DataFormat {
	static formatNumber(value: any, type: string): number | null {
		if (type === "int") {
			return parseInt(value);
		}

		if (type === "float" || type == "number") {
			return parseFloat(value);
		}

		return null;
	}

	static formatString(value: any): string | null {
		if (typeof value != "string") {
			if (typeof value == "number") {
				return value + "";
			}
			if (typeof value == "object") {
				if (Reflect.has(value, "toString")) {
					return value.toString();
				}
			}
			return null;
		}

		return value;
	}

	static formatBoolean(value: any): boolean {
		if (typeof value == "string") {
			if (value == "false") {
				return false;
			}

			//增加判断是不是数值类型
			if (!isNaN(parseInt(value))) {
				return !!parseInt(value);
			}
		}

		return !!value;
	}

	static formatArray(value: any[], type: string): any[] {
		if (type.startsWith("array")) {
			if (typeof value === "string") {
				value = JSON.parse(value);
			}

			if (Array.isArray(value)) {
				let ntype = type.replace(/array/, "");
				value = value.map((item) => {
					return DataFormat.formatValue(item, ntype);
				});

				return value;
			}
		}

		return [];
	}

	static formatDate(value: any): Date {
		if (value instanceof Date) {
			return value;
		}

		return new Date(value);
	}

	static formatValue(value: any, type: string): any {
		if (type.startsWith("array")) {
			return DataFormat.formatArray(value, type);
		}

		switch (type) {
			case "string": {
				return DataFormat.formatString(value);
			}
			case "boolean": {
				return DataFormat.formatBoolean(value);
			}
			case "int":
			case "float":
			case "number": {
				return DataFormat.formatNumber(value, type);
			}
			case "date": {
				return DataFormat.formatDate(value);
			}
			default: {
				return value;
			}
		}
	}
}

export default DataFormat;
