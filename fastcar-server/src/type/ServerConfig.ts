import { Protocol } from "./Protocol";
import { SSLConfig } from "./SSLConfig";

export type ServerConfig = {
	port?: number; //默认80 https默认443
	protocol?: Protocol; //http  http2 或者 https 默认http
	ssl?: SSLConfig;
	hostname?: string; //当填写0.0.0.0时则不开启ipv6了
	options?: { [key: string]: any }; //这个是创建server时设置的自带参数设置
};
