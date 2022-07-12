export type SSLConfig = {
	key: string; //正式key 一般.pem结尾
	cert: string; //证书  一般 .crt结尾
	ca?: string; //服务器根证书
};
