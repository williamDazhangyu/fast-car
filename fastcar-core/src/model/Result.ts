import { FormValidationUtil } from '../utils/FormValidationUtil';

const CODE_OK = 200;
const CODE_FAIL = 500;

/***
 * @version 1.0 封装返回类
 */
export default class Result {

    static ok(data?: Object) {

        return {
            code: CODE_OK,
            msg: "success",
            data: FormValidationUtil.isNotNull(data) ? data : {}
        }
    }

    static errorMsg(msg: string) {

        return {

            code: CODE_FAIL,
            msg: msg,
            data: {}
        }
    }

    static errorCode(msg: string, code: number) {

        return {
            code: code ? code : CODE_FAIL,
            msg: msg,
            data: {}
        }
    }

    static isOK(code: number) {

        return code == CODE_OK;
    }
}