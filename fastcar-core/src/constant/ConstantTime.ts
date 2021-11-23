//时间枚举常量
export enum TimeUnit {

    millisecond = "millisecond",
    second = "second",
    minute = "minute",
    hour = "hour",
    day = "day",
    month = "month",
    year = "year"
}

export const TimeUnitNum = {

    millisecond: 1,
    second: 1000,
    minute: 1000 * 60,
    hour: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24,
    month: 1000 * 60 * 60 * 24 * 30,
    year: 1000 * 60 * 60 * 24 * 365
}