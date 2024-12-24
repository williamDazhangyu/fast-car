export * from "./types/SignType";

import * as axios from "axios";
import { SignType } from "./types/SignType";

//获取签名 仅支持node服务端使用
export function getSign(t: SignType, serect: string): string | null;

export class COSSDK {
	private domain: string;
	private sign: string;

	constructor(info: { domain: string; sign: string });

	//生成账号信息
	genAccountInfo(): Promise<{
		code: number;
		msg: string;
		data: {
			appid: string;
			serectkey: string;
		};
	}>;

	//访问文件 默认为false
	getFile(filename: string, auth?: boolean): Promise<axios.AxiosResponse<any, any>>;

	//上传文件
	uploadfile(filename: string, file: string | Blob): Promise<axios.AxiosResponse<any, any>>;

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
}
