"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DateUtil {
    static twoDigits(num) {
        return num.toString().padStart(2, "0");
    }
    //返回年月日时分秒
    static toDateDesc(datetime = Date.now()) {
        let dataC = new Date(datetime);
        return {
            YYYY: DateUtil.twoDigits(dataC.getFullYear()),
            MM: DateUtil.twoDigits(dataC.getMonth() + 1),
            DD: DateUtil.twoDigits(dataC.getDate()),
            hh: DateUtil.twoDigits(dataC.getHours()),
            mm: DateUtil.twoDigits(dataC.getMinutes()),
            ss: DateUtil.twoDigits(dataC.getSeconds()),
        };
    }
    static toDay(datetime = Date.now(), format = "YYYY-MM-DD") {
        let desc = DateUtil.toDateDesc(datetime);
        let ymd = format
            .replace(/YYYY/, desc.YYYY)
            .replace(/MM/, desc.MM)
            .replace(/DD/, desc.DD);
        return ymd;
    }
    static toHms(datetime = Date.now(), format = "hh:mm:ss") {
        let desc = DateUtil.toDateDesc(datetime);
        let hms = format
            .replace(/hh/, desc.hh)
            .replace(/mm/, desc.mm)
            .replace(/ss/, desc.ss);
        return hms;
    }
    static toDateTime(datetime = Date.now(), format = "YYYY-MM-DD hh:mm:ss") {
        let desc = DateUtil.toDateDesc(datetime);
        let str = format
            .replace(/YYYY/, desc.YYYY)
            .replace(/MM/, desc.MM)
            .replace(/DD/, desc.DD)
            .replace(/hh/, desc.hh)
            .replace(/mm/, desc.mm)
            .replace(/ss/, desc.ss);
        return str;
    }
    static toCutDown(datetime, format = "hh:mm:ss") {
        let hours = Math.floor(datetime / 60 / 60);
        let minutes = Math.floor((datetime - hours * 60 * 60) / 60);
        let seconds = datetime - (hours * 60 + minutes) * 60;
        let str = format
            .replace(/hh/, hours.toString())
            .replace(/mm/, minutes.toString())
            .replace(/ss/, seconds.toString());
        return str;
    }
    static getDateTime(datetimeStr) {
        if (datetimeStr) {
            let dataC = new Date(datetimeStr);
            return dataC.getTime();
        }
        return Date.now();
    }
}
exports.default = DateUtil;
