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

	setSign(sign: string) {
		this.sign = sign;
	}

	async createSign(t: SignType & { serectkey: string }): Promise<{
		code: number;
		data: string;
	}> {
		return (await axios.default.post(`${this.domain}/common/createSign`, t)).data;
	}

	//初始化账号
	async initAccount(): Promise<{
		code: number;
		msg: string;
		data: {
			appid: string;
			serectkey: string;
		};
	}> {
		return (await axios.default.post(`${this.domain}/common/initAccount`)).data;
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

	//添加账号
	async addAccount(): Promise<{
		code: number;
		msg: string;
		data: {
			appid: string;
			serectkey: string;
		};
	}> {
		let res = await axios.default.post(`${this.domain}/addAccount`, {
			sign: this.sign,
		});
		return res.data;
	}

	//删除账号
	async delAccount(account: string): Promise<{
		code: number;
	}> {
		let res = await axios.default.delete(`${this.domain}/delAccount`, {
			params: {
				sign: this.sign,
				account,
			},
		});
		return res.data;
	}

	//设置文件/文件夹权限
	async setPermissions({ filename, permission }: { filename: string; permission: "public" | "private" }): Promise<{
		code: number;
	}> {
		let res = await axios.default.put(`${this.domain}/setPermissions`, {
			sign: this.sign,
			filename: filename.startsWith("/") ? filename : `/${filename}`,
			permission,
		});
		return res.data;
	}

	//获取当前文件/文件夹的权限
	async getPermissions({ filename }: { filename: string }): Promise<{
		filename: string;
		permission: "public" | "private";
		source: "set" | "extend";
	}> {
		let res = await axios.default.get(`${this.domain}/getPermissions`, {
			params: {
				filename,
				sign: this.sign,
			},
		});
		return res.data?.data;
	}

	async delPermissions({ filename }: { filename: string }): Promise<{
		code: number;
	}> {
		let res = await axios.default.delete(`${this.domain}/delPermissions`, {
			params: {
				sign: this.sign,
				filename,
			},
		});
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
		formData.append(filename, file);

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
				filename,
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
				filename,
				sign: this.sign,
			},
		});
		return res.data;
	}

	//创建文件夹 允许带权限
	async createDir(
		dirname: string,
		permission?: "public" | "private"
	): Promise<{
		code: number;
	}> {
		if (!dirname.startsWith("/")) {
			dirname = `/${dirname}`;
		}

		let res = await axios.default.post(`${this.domain}/createDir`, {
			dirname,
			sign: this.sign,
			permission,
		});

		return res.data;
	}

	//设置重定向
	async setRedirect({ redirectUrl, flag, bucket }: { redirectUrl: string; flag: boolean; bucket?: string }): Promise<{
		code: number;
	}> {
		let res = await axios.default.post(`${this.domain}/setRedirect`, {
			redirectUrl,
			flag,
			bucket,
			sign: this.sign,
		});

		return res.data;
	}

	async getAccountList(): Promise<string[]> {
		let res = await axios.default.get(`${this.domain}/getAccountList`, {
			params: {
				sign: this.sign,
			},
		});
		return res.data.data;
	}

	async checkSign() {
		try {
			let res = await axios.default.get(`${this.domain}/checkSign`, {
				params: {
					sign: this.sign,
				},
			});
			return res.data.code;
		} catch (e: any) {
			return e.status;
		}
	}
}
