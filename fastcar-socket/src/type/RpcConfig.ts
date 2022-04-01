import { ClientSession } from "./SocketConfig";

export type RpcMessage = {
	id?: number;
	url: string; //路由
	data?: Object; //请求数据
	body?: Object; //回传数据
};

//中间件过滤原则
export type Middleware = (context: ClientSession & RpcMessage, next: Middleware) => void;

export const DesignMeta = {
	RPCMIDDLEWARE: Symbol("RPCMIDDLEWARE"),
};
