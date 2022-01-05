"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
class CryptoUtil {
    static aesDecode(cryptkey, iv, secretdata, aesType = "aes-256-cbc" /* aes */) {
        let decipher = crypto.createDecipheriv(aesType, cryptkey, iv);
        let decoded = decipher.update(secretdata, "base64", "utf8");
        decoded += decipher.final("utf8");
        return decoded;
    }
    static aesEncode(cryptkey, iv, cleardata, aesType = "aes-256-cbc" /* aes */) {
        let encipher = crypto.createCipheriv("aes-256-cbc" /* aes */, cryptkey, iv);
        let encoded = encipher.update(cleardata, "utf8", "base64");
        encoded += encipher.final("base64");
        return encoded;
    }
    static shaEncode(cryptkey, data) {
        let hash = crypto.createHmac("sha256", cryptkey);
        return hash.update(data).digest("base64");
    }
    static gcmEncrypt(password, msg) {
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
        }
        catch (e) {
            console.log("Encrypt is error", e);
            return null;
        }
    }
    static gcmDecrypt(password, serect) {
        try {
            let tmpSerect = Buffer.from(serect, "base64");
            let pwd = Buffer.from(password, "hex");
            //读取数组
            let iv = tmpSerect.slice(0, 12);
            let cipher = crypto.createDecipheriv("aes-128-gcm", pwd, iv);
            //这边的数据为 去除头的iv12位和尾部的tags的16位
            let msg = cipher.update(tmpSerect.slice(12, tmpSerect.length - 16));
            return msg.toString("utf8");
        }
        catch (e) {
            console.log("Decrypt is error", e);
            return null;
        }
    }
    static sha256Encode(text, serect = crypto.randomBytes(32).toString("hex"), encoding = "base64") {
        let msg = crypto
            .createHmac("sha256", serect)
            .update(text)
            .digest(encoding);
        return {
            salt: serect,
            msg: msg,
        };
    }
    static sha256EncodeContent(str, encoding = "base64") {
        let msg = crypto
            .createHash("sha256")
            .update(str)
            .digest(encoding);
        return msg;
    }
    static sha256Very(msg, serect, encodeMsg, encoding = "base64") {
        let result = this.sha256Encode(msg, serect, encoding);
        return result.msg === encodeMsg;
    }
    static getHashStr(num = 16) {
        return crypto.randomBytes(num).toString("hex");
    }
}
exports.default = CryptoUtil;
