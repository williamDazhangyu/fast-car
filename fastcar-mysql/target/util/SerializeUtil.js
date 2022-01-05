"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("fastcar-core/utils");
class SerializeUtil {
    static serialize(value, type) {
        if (value == null) {
            return null;
        }
        switch (type) {
            case "string": {
                return utils_1.DataFormat.formatString(value);
            }
            case "boolean": {
                return !!value ? 1 : 0;
            }
            case "number": {
                return utils_1.DataFormat.formatNumber(value, type);
            }
            case "date": {
                return utils_1.DateUtil.toDateTime(value);
            }
            default: {
                return JSON.stringify(value);
            }
        }
    }
}
exports.default = SerializeUtil;
