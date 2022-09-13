export default class DateUtil {
	static twoDigits(num: number): string {
		return num.toString().padStart(2, "0");
	}

	//返回年月日时分秒
	static toDateDesc(datetime: number | string | Date = Date.now()) {
		let dataC = new Date(datetime);
		return {
			YYYY: DateUtil.twoDigits(dataC.getFullYear()),
			MM: DateUtil.twoDigits(dataC.getMonth() + 1),
			DD: DateUtil.twoDigits(dataC.getDate()),
			hh: DateUtil.twoDigits(dataC.getHours()),
			mm: DateUtil.twoDigits(dataC.getMinutes()),
			ss: DateUtil.twoDigits(dataC.getSeconds()),
			ms: DateUtil.twoDigits(dataC.getMilliseconds()),
		};
	}

	static toDay(datetime: number | string | Date = Date.now(), format: string = "YYYY-MM-DD") {
		let desc = DateUtil.toDateDesc(datetime);
		let ymd = format.replace(/YYYY/, desc.YYYY).replace(/MM/, desc.MM).replace(/DD/, desc.DD);
		return ymd;
	}

	static toHms(datetime: number | string | Date = Date.now(), format: string = "hh:mm:ss") {
		let desc = DateUtil.toDateDesc(datetime);
		let hms = format.replace(/hh/, desc.hh).replace(/mm/, desc.mm).replace(/ss/, desc.ss);

		return hms;
	}

	static toDateTime(datetime: number | string | Date = Date.now(), format: string = "YYYY-MM-DD hh:mm:ss"): string {
		let desc = DateUtil.toDateDesc(datetime);
		let str = format.replace(/YYYY/, desc.YYYY).replace(/MM/, desc.MM).replace(/DD/, desc.DD).replace(/hh/, desc.hh).replace(/mm/, desc.mm).replace(/ss/, desc.ss);

		return str;
	}

	static toDateTimeMS(datetime: number | string | Date = Date.now(), format: string = "YYYY-MM-DD hh:mm:ss.sss"): string {
		let desc = DateUtil.toDateDesc(datetime);
		let str = format.replace(/YYYY/, desc.YYYY).replace(/MM/, desc.MM).replace(/DD/, desc.DD).replace(/hh/, desc.hh).replace(/mm/, desc.mm).replace(/ss/, desc.ss).replace(/sss/, desc.ms);

		return str;
	}

	static toCutDown(datetime: number, format: string = "hh:mm:ss"): string {
		let hours = Math.floor(datetime / 60 / 60);
		let minutes = Math.floor((datetime - hours * 60 * 60) / 60);
		let seconds = datetime - (hours * 60 + minutes) * 60;

		let str = format.replace(/hh/, hours.toString()).replace(/mm/, minutes.toString()).replace(/ss/, seconds.toString());

		return str;
	}

	static getTimeStr(datetime: number): string {
		let days = datetime / (1000 * 60 * 60 * 24);
		if (days >= 1) {
			return `${days.toFixed(2)}d`;
		}

		let hours = datetime / (1000 * 60 * 60);
		if (hours >= 1) {
			return `${hours.toFixed(2)}h`;
		}

		let minutes = datetime / (1000 * 60);
		if (minutes >= 1) {
			return `${minutes.toFixed(2)}m`;
		}

		let seconds = datetime / 1000;
		return `${Math.floor(seconds)}s`;
	}

	static getDateTime(datetimeStr?: string | number): number {
		if (datetimeStr) {
			let dataC = new Date(datetimeStr);
			return dataC.getTime();
		}

		return Date.now();
	}
}
