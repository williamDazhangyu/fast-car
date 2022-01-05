"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Format {
    static formatFirstToUp(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }
    static formatFirstToLow(str) {
        return str.charAt(0).toLowerCase() + str.substring(1);
    }
    static formatFirstToUpEnd(str) {
        return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    }
}
exports.default = Format;
