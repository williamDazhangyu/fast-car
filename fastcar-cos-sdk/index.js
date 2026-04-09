"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COSSDK = void 0;
exports.getSign = getSign;
const axios = require("axios");
//获取签名 仅支持node服务端使用
function getSign(t, serect) {
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
    }
    catch (e) {
        console.log("Encrypt is error", e);
        return null;
    }
}
class COSSDK {
    domain;
    sign;
    constructor(info) {
        this.domain = info.domain;
        this.sign = info.sign;
        if (this.domain.endsWith("/")) {
            this.domain = this.domain.substring(0, this.domain.length - 1);
        }
    }
    setSign(sign) {
        this.sign = sign;
    }
    async createSign(t) {
        return (await axios.default.post(`${this.domain}/common/createSign`, t)).data;
    }
    //初始化账号
    async initAccount() {
        return (await axios.default.post(`${this.domain}/common/initAccount`)).data;
    }
    //生成账号信息
    async genAccountInfo() {
        let res = await axios.default.get(`${this.domain}/common/getAccountInfo?sign=${this.sign}`);
        return res.data;
    }
    //添加账号
    async addAccount() {
        let res = await axios.default.post(`${this.domain}/addAccount`, {
            sign: this.sign,
        });
        return res.data;
    }
    //删除账号
    async delAccount(account) {
        let res = await axios.default.delete(`${this.domain}/delAccount`, {
            params: {
                sign: this.sign,
                account,
            },
        });
        return res.data;
    }
    //设置文件/文件夹权限
    async setPermissions({ filename, permission }) {
        let res = await axios.default.put(`${this.domain}/setPermissions`, {
            sign: this.sign,
            filename: filename.startsWith("/") ? filename : `/${filename}`,
            permission,
        });
        return res.data;
    }
    //获取当前文件/文件夹的权限
    async getPermissions({ filename }) {
        let res = await axios.default.get(`${this.domain}/getPermissions`, {
            params: {
                filename,
                sign: this.sign,
            },
        });
        return res.data?.data;
    }
    async delPermissions({ filename }) {
        let res = await axios.default.delete(`${this.domain}/delPermissions`, {
            params: {
                sign: this.sign,
                filename,
            },
        });
        return res.data;
    }
    //访问文件
    getFile(filename, auth = false) {
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
    uploadfile(filename, file) {
        let formData = new FormData();
        formData.append(filename, file);
        return axios.default.post(`${this.domain}/uploadfile?sign=${this.sign}`, formData, {
            headers: {
                "Content-type": "multipart/form-data;",
            },
        });
    }
    //解压文件
    extractFile(filename, targetDir) {
        return axios.default.post(`${this.domain}/extractFile`, {
            sign: this.sign,
            filename,
            targetDir,
        });
    }
    //删除分块文件
    async deleteChunkFile(filename, totalChunks) {
        let res = await axios.default.delete(`${this.domain}/deleteChunkFile`, {
            params: {
                filename,
                totalChunks,
                sign: this.sign,
            },
        });
        return res.status == 200;
    }
    //删除资源文件
    async deleteFile(filename) {
        let res = await axios.default.delete(`${this.domain}/deleteFile`, {
            params: {
                filename,
                sign: this.sign,
            },
        });
        return res.status == 200;
    }
    //查询文件列表
    async queryFilelist(filename) {
        let res = await axios.default.get(`${this.domain}/queryFilelist`, {
            params: {
                filename,
                sign: this.sign,
            },
        });
        return res.data;
    }
    //创建文件夹 允许带权限
    async createDir(dirname, permission) {
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
    async setRedirect({ redirectUrl, flag, bucket, domain }) {
        let res = await axios.default.post(`${this.domain}/setRedirect`, {
            redirectUrl,
            flag,
            bucket,
            domain,
            sign: this.sign,
        });
        return res.data;
    }
    async getAccountList() {
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
        }
        catch (e) {
            return e.status;
        }
    }
    //重命名文件夹或者文件
    async rename(filename, newFilename) {
        let res = await axios.default.put(`${this.domain}/rename`, {
            filename,
            newname: newFilename,
            sign: this.sign,
        });
        return res.data.code == 200;
    }
    //查询重定向信息
    async getRedirect() {
        let res = await axios.default.get(`${this.domain}/getRedirect`, {
            params: {
                sign: this.sign,
            },
        });
        return res.data;
    }
    //查询单个重定向信息
    async queryRedirect({ bucketUrl, domain }) {
        let res = await axios.default.get(`${this.domain}/queryRedirect`, {
            params: {
                sign: this.sign,
                bucketUrl,
                domain,
            },
        });
        return res.data;
    }
    //获取域名列表
    async getDomains() {
        let res = await axios.default.get(`${this.domain}/getDomains`, {
            params: {
                sign: this.sign,
            },
        });
        return res.data;
    }
    //保存域名列表
    async saveDomains(domains) {
        let res = await axios.default.post(`${this.domain}/saveDomains`, {
            domains,
            sign: this.sign,
        });
        return res.data;
    }
    //删除重定向配置
    async delRedirect({ bucket, domain }) {
        let res = await axios.default.delete(`${this.domain}/delRedirect`, {
            params: {
                bucket,
                domain,
                sign: this.sign,
            },
        });
        return res.data;
    }
    async request({ url, data, method, axiosConfig = {}, }) {
        let params = {};
        if (method == "GET") {
            params = Object.assign({
                sign: this.sign,
            }, data || {});
        }
        else {
            params = Object.assign({ sign: this.sign });
        }
        try {
            let res = await axios.default.request({
                url: `${this.domain}${url}`,
                data,
                params,
                method,
                ...axiosConfig,
            });
            return res.data;
        }
        catch (e) {
            return null;
        }
    }
}
exports.COSSDK = COSSDK;
