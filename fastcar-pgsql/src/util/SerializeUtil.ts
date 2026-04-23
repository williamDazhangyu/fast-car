import { DataFormat, DateUtil } from "@fastcar/core/utils";

export default class SerializeUtil {
	static serialize(value: any, type: string, dbType?: string): any {
		if (value == null) {
			return null;
		}

		let formatType = (type || "").toLowerCase();
		let formatDbType = (dbType || "").toLowerCase();
		if (
			formatType == "vector" ||
			formatType == "float32array" ||
			formatDbType == "vector" ||
			/^vector\s*\(\s*\d+\s*\)$/.test(formatType) ||
			/^vector\s*\(\s*\d+\s*\)$/.test(formatDbType)
		) {
			// pgvector expects a string literal like "[1,2,3]" for bound parameters
			if (Array.isArray(value)) {
				return `[${value.join(",")}]`;
			}
			if (value instanceof Float32Array) {
				return `[${Array.from(value).join(",")}]`;
			}
			return value;
		}

		switch (type) {
			case "string": {
				return DataFormat.formatString(value);
			}
			case "boolean": {
				return !!value ? 1 : 0;
			}
			case "number": {
				return DataFormat.formatNumber(value, type);
			}
			case "date": {
				return DateUtil.toDateTime(value);
			}
			case "jsonb":
			case "json": {
				return typeof value == "string" ? value : JSON.stringify(value);
			}
			default: {
				return JSON.stringify(value);
			}
		}
	}
}
