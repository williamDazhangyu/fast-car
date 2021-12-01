"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeUnitNum = exports.TimeUnit = void 0;
//时间枚举常量
var TimeUnit;
(function (TimeUnit) {
    TimeUnit["millisecond"] = "millisecond";
    TimeUnit["second"] = "second";
    TimeUnit["minute"] = "minute";
    TimeUnit["hour"] = "hour";
    TimeUnit["day"] = "day";
    TimeUnit["month"] = "month";
    TimeUnit["year"] = "year";
})(TimeUnit = exports.TimeUnit || (exports.TimeUnit = {}));
var TimeUnitNum;
(function (TimeUnitNum) {
    TimeUnitNum[TimeUnitNum["millisecond"] = 1] = "millisecond";
    TimeUnitNum[TimeUnitNum["second"] = 1000] = "second";
    TimeUnitNum[TimeUnitNum["minute"] = 60000] = "minute";
    TimeUnitNum[TimeUnitNum["hour"] = 3600000] = "hour";
    TimeUnitNum[TimeUnitNum["day"] = 86400000] = "day";
    TimeUnitNum[TimeUnitNum["month"] = 2592000000] = "month";
    TimeUnitNum[TimeUnitNum["year"] = 31536000000] = "year";
})(TimeUnitNum = exports.TimeUnitNum || (exports.TimeUnitNum = {}));
