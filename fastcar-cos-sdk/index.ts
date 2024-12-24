import * as axios from "axios";
import { SignType } from "./types/SignType";

//获取签名 仅支持node服务端使用
export function getSign(t: SignType, serect: string) {
	const crypto = require("crypto");
	try {
		let pwd = Buffer.from(serect);
		let iv = crypto.randomBytes(12);

		let cipher = crypto.createCipheriv("aes-256-gcm", pwd, iv);

		//加密
		let enc = cipher.update(JSON.stringify(t), "utf8", "base64");
		enc += cipher.final("base64");

		//cipher.getAuthTag() 方法返回一个 Buffer，它包含已从给定数据计算后的认证标签。
		//cipher.getAuthTag() 方法只能在使用 cipher.final() 之后调用 这里返回的是一个十六进制后的数组
		let tags = cipher.getAuthTag();
		let encStr = Buffer.from(enc, "base64");

		//由于和java对应的AES/GCM/PKCS5Padding模式对应 所以采用这个拼接
		let totalLength = iv.length + encStr.length + tags.length;
		let bufferMsg = Buffer.concat([iv, encStr, tags], totalLength);

		return encodeURIComponent(`${t.appid};${bufferMsg.toString("base64")}`);
	} catch (e) {
		console.log("Encrypt is error", e);
		return null;
	}
}

export class COSSDK {
	private domain: string;
	private sign: string;

	constructor(info: { domain: string; sign: string }) {
		this.domain = info.domain;
		this.sign = info.sign;

		if (this.domain.endsWith("/")) {
			this.domain = this.domain.substring(0, this.domain.length - 1);
		}
	}

	//生成账号信息
	async genAccountInfo(): Promise<{
		code: number;
		msg: string;
		data: {
			appid: string;
			serectkey: string;
		};
	}> {
		let res = await axios.default.get(`${this.domain}/common/getAccountInfo?sign=${this.sign}`);
		return res.data;
	}

	//访问文件
	getFile(filename: string, auth: boolean = false) {
		if (filename.startsWith(`http`)) {
			return axios.default.get(encodeURI(filename));
		}
		if (!filename.startsWith("/")) {
			filename = `/${filename}`;
		}

		let params = {};
		if (auth) {
			Reflect.set(params, "sign", this.sign);
		}

		return axios.default.get(`${this.domain}${encodeURI(filename)}`, {
			params,
		});
	}

	//上传文件
	uploadfile(filename: string, file: string | Blob) {
		let formData = new FormData();
		formData.append(encodeURI(filename), file);

		return axios.default.post(`${this.domain}/uploadfile?sign=${this.sign}`, formData, {
			headers: {
				"Content-type": "multipart/form-data;",
			},
		});
	}

	//删除资源文件
	async deleteFile(filename: string): Promise<boolean> {
		let res = await axios.default.delete(`${this.domain}/deleteFile`, {
			params: {
				filename: encodeURI(filename),
				sign: this.sign,
			},
		});
		return res.status == 200;
	}

	//查询文件列表
	async queryFilelist(filename: string): Promise<{
		code: number;
		data?: Array<{
			name: string;
			create_time: number;
			modify_time: number;
			size: number; //文件大小
			file: boolean;
		}>;
		msg: string;
	}> {
		let res = await axios.default.get(`${this.domain}/queryFilelist`, {
			params: {
				filename: encodeURI(filename),
				sign: this.sign,
			},
		});
		return res.data;
	}
}
