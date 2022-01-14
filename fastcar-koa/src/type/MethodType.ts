import { RouteMethods } from "./RouteMethods";

//方法类型
export type MethodType = {
	url: string;
	request: RouteMethods[]; //请求方式
	method: string; //绑定的函数名
};
