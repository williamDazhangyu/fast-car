/***
 * @version 1.0 数据格式处理
 */
export default class DATAFORMAT {

    static twoDigits(num: number) {

        return num.toString().padStart(2, '0');
    }

    static toMysqlDay(datetime: number = Date.now()) {

        let dataC = new Date(datetime);
        let day = `${DATAFORMAT.twoDigits(dataC.getFullYear())}-${DATAFORMAT.twoDigits(dataC.getMonth() + 1)}-${DATAFORMAT.twoDigits(dataC.getDate())}`;

        return day;
    }

    static toMysqlHms(datetime: number = Date.now()) {

        let dataC = new Date(datetime);
        let hms = `${DATAFORMAT.twoDigits(dataC.getHours())}:${DATAFORMAT.twoDigits(dataC.getMinutes())}:${DATAFORMAT.twoDigits(dataC.getSeconds())}`;

        return hms;
    }

    static toHMS(datetime: number) {

        //先计算小时
        let hours = Math.floor(datetime / 60 / 60);
        let minutes = Math.floor((datetime - hours * 60 * 60) / 60);
        let seconds = datetime - (hours * 60 + minutes) * 60;

        return `${DATAFORMAT.twoDigits(hours)}时${DATAFORMAT.twoDigits(minutes)}分${DATAFORMAT.twoDigits(seconds)}秒`;
    }

    static toMysqlDateTime(datetime: number = Date.now()) {

        let dataC = new Date(datetime);
        let day = `${DATAFORMAT.twoDigits(dataC.getFullYear())}-${DATAFORMAT.twoDigits(dataC.getMonth() + 1)}-${DATAFORMAT.twoDigits(dataC.getDate())}`;
        let hms = `${DATAFORMAT.twoDigits(dataC.getHours())}:${DATAFORMAT.twoDigits(dataC.getMinutes())}:${DATAFORMAT.twoDigits(dataC.getSeconds())}`;

        return day + " " + hms;
    }

    static getDateTime(datetimeStr: string) {

        if (!!datetimeStr) {

            let dataC = new Date(datetimeStr);
            return dataC.getTime();
        }

        return Date.now();
    }

    //统一范围为null
    static formatNumber(value: any, type: string) {

        let n = null;
        if (type === "int") {

            n = parseInt(value);
        }

        if (type === "float" || type == "number") {

            n = parseFloat(value);
        }

        return isNaN(n) ? null : n;
    }

    static formatString(value: any) {

        if (typeof value != 'string') {

            return "";
        }

        return value;
    }

    static formatBoolean(value: any) {

        return !!value;
    }

    static formatArray(value: any[], type: string) {

        if (type.startsWith('array')) {

            if (typeof value === 'string') {

                value = JSON.parse(value);
            }

            if (Array.isArray(value)) {

                let ntype = type.replace(/array/, "");
                value = value.map((item) => {

                    return DATAFORMAT.formatValue(item, ntype);
                });

                return value;
            }
        }

        return [];
    }

    static formatDate(value: any) {

        if (typeof value === 'string') {

            return DATAFORMAT.toMysqlDateTime(new Date(value).getTime());
        }

        if (value instanceof Date) {

            return DATAFORMAT.toMysqlDateTime(value.getTime());
        }

        return DATAFORMAT.toMysqlDateTime();
    };

    static formatValue(value: any, type: string) {

        //判定类型
        if (type.startsWith('array')) {

            return DATAFORMAT.formatArray(value, type);
        }

        let formatFun = DATAFORMAT.formatNumber;
        switch (type) {

            case "string": {

                formatFun = DATAFORMAT.formatString;
                break;
            }
            case "boolean": {

                formatFun = DATAFORMAT.formatBoolean;
                break;
            }
            case "int":
            case "float":
            case "number": {

                formatFun = DATAFORMAT.formatNumber;
                break;
            }
            case "date": {

                formatFun = DATAFORMAT.formatDate;
                break;
            }
            default: {

                return value;
            }
        }

        return formatFun(value, type);
    }
}