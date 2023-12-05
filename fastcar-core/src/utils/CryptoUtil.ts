import * as crypto from "crypto";
import { BinaryToTextEncoding } from "crypto";

const enum serects {
	aes = "aes-256-cbc",
	sha256 = "sha256",
}

export default class CryptoUtil {
	static aesDecode(cryptkey: string, iv: string, secretdata: string, aesType: string = serects.aes): string {
		let decipher = crypto.createDecipheriv(aesType, cryptkey, iv);
		let decoded = decipher.update(secretdata, "base64", "utf8");

		decoded += decipher.final("utf8");
		return decoded;
	}

	static aesEncode(cryptkey: string, iv: string, cleardata: string, aesType: string = serects.aes): string {
		let encipher = crypto.createCipheriv(serects.aes, cryptkey, iv);
		let encoded = encipher.update(cleardata, "utf8", "base64");

		encoded += encipher.final("base64");
		return encoded;
	}

	static shaEncode(cryptkey: string, data: string): string {
		let hash = crypto.createHmac("sha256", cryptkey);
		return hash.update(data).digest("base64");
	}

	static gcmEncrypt(password: string, msg: string): string | null {
		try {
			let pwd = Buffer.from(password, "hex");
			let iv = crypto.randomBytes(12);
			let cipher = crypto.createCipheriv("aes-128-gcm", pwd, iv);

			//加密
			let enc = cipher.update(msg, "utf8", "base64");
			enc += cipher.final("base64");

			//cipher.getAuthTag() 方法返回一个 Buffer，它包含已从给定数据计算后的认证标签。
			//cipher.getAuthTag() 方法只能在使用 cipher.final() 之后调用 这里返回的是一个十六进制后的数组
			let tags = cipher.getAuthTag();
			let encStr = Buffer.from(enc, "base64");

			//由于和java对应的AES/GCM/PKCS5Padding模式对应 所以采用这个拼接
			let totalLength = iv.length + encStr.length + tags.length;
			let bufferMsg = Buffer.concat([iv, encStr, tags], totalLength);

			return bufferMsg.toString("base64");
		} catch (e) {
			console.log("Encrypt is error", e);
			return null;
		}
	}

	static gcmDecrypt(password: string, serect: string): string | null {
		try {
			let tmpSerect = Buffer.from(serect, "base64");
			let pwd = Buffer.from(password, "hex");

			//读取数组
			let iv = tmpSerect.subarray(0, 12);
			let cipher = crypto.createDecipheriv("aes-128-gcm", pwd, iv);

			//这边的数据为 去除头的iv12位和尾部的tags的16位
			let msg = cipher.update(tmpSerect.subarray(12, tmpSerect.length - 16));

			return msg.toString("utf8");
		} catch (e) {
			console.log("Decrypt is error", e);
			return null;
		}
	}

	static sha256Encode(text: string, serect: string = crypto.randomBytes(32).toString("hex"), encoding: BinaryToTextEncoding = "base64"): { salt: string; msg: string } {
		let msg = crypto.createHmac("sha256", serect).update(text).digest(encoding);

		return {
			salt: serect,
			msg: msg,
		};
	}

	static sha256EncodeContent(str: string, encoding: BinaryToTextEncoding = "base64"): string {
		let msg = crypto.createHash("sha256").update(str).digest(encoding);

		return msg;
	}

	static sha256Very(msg: string, serect: string, encodeMsg: string, encoding: BinaryToTextEncoding = "base64"): boolean {
		let result = this.sha256Encode(msg, serect, encoding);

		return result.msg === encodeMsg;
	}

	static getHashStr(num: number = 16): string {
		return crypto.randomBytes(num).toString("hex");
	}

	//根据给定的字符串返回hash值按照追加的原则
	static getHashStrByLength(serect: string, num: number): string {
		let list = crypto.createHash("md5").update(serect).digest().toString("hex");

		while (list.length < num) {
			list = list.repeat(num - list.length);
		}

		return list.substring(0, num);
	}
}
