import { BinaryToTextEncoding } from "crypto";

//时间工具类
export class DateUtil {
	static twoDigits(num: number): string;

	static toDay(datetime?: number | string | Date, format?: string): string;

	static toHms(datetime?: number | string | Date, format?: string): string;

	static toDateTime(datetime?: number | string | Date, format?: string): string;

	static toCutDown(datetime: number, format?: string): string;

	static getDateTime(datetimeStr?: string | number): number;
}

export class DataFormat {
	static formatNumber(value: any, type: string): number | null;

	static formatString(value: any): string | null;

	static formatBoolean(value: any): boolean;

	static formatArray(value: any[], type: string): any[];

	static formatDate(value: any): Date;

	static formatValue(value: any, type: string): any;
}

export class CryptoUtil {
	static aesDecode(cryptkey: string, iv: string, secretdata: string, aesType?: string): string;

	static aesEncode(cryptkey: string, iv: string, cleardata: string, aesType?: string): string;

	static shaEncode(cryptkey: string, data: string): string;

	static gcmEncrypt(password: string, msg: string): string | null;

	static gcmDecrypt(password: string, serect: string): string | null;

	static sha256Encode(text: string, serect?: string, encoding?: BinaryToTextEncoding): { salt: string; msg: string };

	static sha256EncodeContent(str: string, encoding?: BinaryToTextEncoding): string;

	static sha256Very(msg: string, serect: string, encodeMsg: string, encoding?: BinaryToTextEncoding): boolean;

	static getHashStr(num?: number): string;
}

export class FileUtil {
	static getFilePathList(filePath: string): string[];

	static getSuffix(filePath: string): string;

	static getFileName(filePath: string): string;

	static getResource(fp: string): object | null;
}

export class TypeUtil {
	static isFunction(f: any): boolean;

	static isClass(f: any): boolean;

	static isString(str: any): boolean;

	static isObject(f: any): boolean;

	static isTSORJS(fp: string): boolean;

	static isPromise(f: Function): boolean;

	static isArray(value: any): boolean;
}

export class ValidationUtil {
	static isNotNull(param: any): boolean;

	static isNull(param: any): boolean;

	static isNumber(param: any): boolean;

	static isString(param: any): boolean;

	static isBoolean(param: any): boolean;

	static isDate(param: any): boolean;

	static isNotMaxSize(param: any, value: number): boolean;

	static isNotMinSize(param: any, value: number): boolean;

	static isArray(param: any, type: string): boolean;

	static checkType(param: any, type: string): boolean;
}
