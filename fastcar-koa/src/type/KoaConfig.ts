import { ServerConfig } from "@fastcar/server";

//和koa的约定配置
export type KoaConfig = {
	server: ServerConfig[] | ServerConfig; //监听的端口号
	koaStatic?: { [key: string]: string }; //相对路径为resource下的 或者绝对文件路径
	koaBodyOptions?: { [key: string]: any }; //文件上传的解析
	koaBodyParser?: { [key: string]: any }; //bodyParser.Options; //解析请求
	extra?: { [key: string]: any }; //拓展设置
	koaProxy?: {
		//基于http-proxy-middleware来进行拓展
		[key: string]: {
			target: string;
			changeOrigin?: boolean;
			pathRewrite?: {
				[key: string]: string;
			};
			ws: boolean;
		} & any;
	};
};
