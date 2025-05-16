export * from "./types/SignType";

import * as axios from "axios";
import { SignType } from "./types/SignType";

//获取签名 仅支持node服务端使用
export function getSign(t: SignType, serect: string): string | null;

export class COSSDK {
	private domain: string;
	private sign: string;

	constructor(info: { domain: string; sign: string });

	initAccount(): Promise<{
		code: number;
		msg: string;
		data: {
			appid: string;
			serectkey: string;
		};
	}>;

	//生成账号信息
	genAccountInfo(): Promise<{
		code: number;
		msg: string;
		data: {
			appid: string;
			serectkey: string;
		};
	}>;

	addAccount(): Promise<{
		code: number;
		msg: string;
		data: {
			appid: string;
			serectkey: string;
		};
	}>;

	delAccount(account: string): Promise<{
		code: number;
	}>;

	setPermissions({ filename, permission }: { filename: string; permission: "public" | "private" }): Promise<{
		code: number;
	}>;

	getPermissions({ filename }: { filename: string }): Promise<{
		filename: string;
		permission: "public" | "private";
		source: "set" | "extend";
	}>;

	delPermissions({ filename }: { filename: string }): Promise<{
		code: number;
	}>;

	//访问文件 默认为false
	getFile(filename: string, auth?: boolean): Promise<axios.AxiosResponse<any, any>>;

	//上传文件
	uploadfile(
		filename: string,
		file: string | Blob
	): Promise<
		axios.AxiosResponse<
			{
				data: string[];
			},
			any
		>
	>;
	extractFile(filename: string, targetDir: string):Promise<{
		code: number;
		msg:string
	}>
	//删除分块文件
	deleteChunkFile(filename: string,totalChunks:number): Promise<boolean>;

	//删除资源文件
	deleteFile(filename: string): Promise<boolean>;

	//查询文件列表
	queryFilelist(filename: string): Promise<{
		code: number;
		data?: Array<{
			name: string;
			create_time: number;
			modify_time: number;
			size: number; //文件大小
			file: boolean;
		}>;
		msg: string;
	}>;

	//创建文件夹
	createDir(
		dirname: string,
		permission?: "public" | "private"
	): Promise<{
		code: number;
	}>;

	//设置重定向文件
	setRedirect({ redirectUrl, flag, bucket }: { redirectUrl: string; flag: boolean; bucket?: string }): Promise<{
		code: number;
	}>;

	getAccountList(): Promise<string[]>;

	checkSign(): Promise<number>;

	createSign(t: SignType & { serectkey: string }): Promise<{
		code: number;
		data: string;
	}>;

	setSign(sign: string): void;

	rename(filename: string, newFilename: string): Promise<boolean>;
}
