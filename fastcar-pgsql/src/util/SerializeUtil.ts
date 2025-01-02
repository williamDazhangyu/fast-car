import { DataFormat, DateUtil } from "@fastcar/core/utils";

export default class SerializeUtil {
	static serialize(value: any, type: string): any {
		if (value == null) {
			return null;
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
