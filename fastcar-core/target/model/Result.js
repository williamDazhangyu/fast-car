"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ValidationUtil_1 = require("../utils/ValidationUtil");
const CODE_OK = 200;
const CODE_FAIL = 500;
/***
 * @version 1.0 封装返回类
 */
class Result {
    static ok(data) {
        return {
            code: CODE_OK,
            msg: "success",
            data: ValidationUtil_1.default.isNotNull(data) ? data : {},
        };
    }
    static errorMsg(msg) {
        return {
            code: CODE_FAIL,
            msg: msg,
            data: {},
        };
    }
    static errorCode(msg, code) {
        return {
            code: code ? code : CODE_FAIL,
            msg: msg,
            data: {},
        };
    }
    static isOK(code) {
        return code == CODE_OK;
    }
}
exports.default = Result;
