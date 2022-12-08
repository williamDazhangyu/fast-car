import * as koaBody from "koa-body";
import * as bodyParser from "koa-bodyparser";
import { ServerConfig } from "@fastcar/server";

//和koa的约定配置
export type KoaConfig = {
	server: ServerConfig[] | ServerConfig; //监听的端口号
	koaStatic?: { [key: string]: string }; //相对路径为resource下的 或者绝对文件路径
	koaBodyOptions?: koaBody.IKoaBodyOptions; //文件上传的解析
	koaBodyParser?: bodyParser.Options; //解析请求
	extra?: { [key: string]: any }; //拓展设置
	swagger?: { enable: boolean; api: { [alias: string]: string } }; //别名:路径
};
