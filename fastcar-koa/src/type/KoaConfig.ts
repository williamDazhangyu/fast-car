import * as koaBody from "koa-body";
import * as bodyParser from "koa-bodyparser";

export enum HttpProtocol {
	http = "http",
	http2 = "http2",
	https = "https",
}

export type SSLConfig = {
	key: string; //正式key 一般.pem结尾
	cert: string; //证书  一般 .crt结尾
};

export type ServerConfig = {
	port?: number; //默认80 https默认443
	protocol?: HttpProtocol; //http  http2 或者 https 默认http
	ssl?: SSLConfig;
	hostname?: string; //当填写0.0.0.0时则不开启ipv6了
};

//和koa的约定配置
export type KoaConfig = {
	server: ServerConfig[] | ServerConfig; //监听的端口号
	koaStatic?: { [key: string]: string }; //相对路径为resource下的 或者绝对文件路径
	koaBodyOptions?: koaBody.IKoaBodyOptions; //文件上传的解析
	koaBodyParser?: bodyParser.Options; //解析请求
	extra?: { [key: string]: any }; //拓展设置
	swagger?: { enable: boolean; api: { [alias: string]: string } }; //别名:路径
};
