import TaskAsync from "../model/TaskAsync";
import { ClientSession, SessionId, SocketClientConfig, SocketServerConfig } from "./SocketConfig";

export type RpcUrl = string;
export type RouteMethod = string;

//请求方式
export enum InteractiveMode {
	request = 0, //向上发起请求  request
	response = 1, //向下做出回应  response
	notify = 2, //仅用于通知  只有回应 response
}

//请求数据
export type RpcMessage = {
	id?: number; //为发起端的id 如果是终端发起的无需通知的则没有id
	url: string; //路由
	data?: { [key: string]: any }; //请求数据
	body?: Object; //回传数据
	mode: InteractiveMode; //交互模式 request和response为同步模式的一问一答 notify则为异步通知
};

//通知数据回传
export type RpcNotiyMessage = {
	id?: number;
	url: string;
	data?: { [key: string]: any };
	channel?: string;
	sessionId?: SessionId;
	excludeIds?: SessionId[];
};

export type RpcContext = ClientSession & RpcMessage;

//中间件过滤原则
export type Middleware = (context: RpcContext, next?: Function) => void;

export type RouterType = {
	url?: string;
};

//rpc路由设置
export type MethodType = {
	url: RouteMethod;
	method: string;
};

//服务端请求
export type RpcServerRequestType = {
	sessionId: SessionId;
	msg: RpcMessage;
	retryCount?: number;
	retryInterval?: number;
	timeout?: number; //超时时间
};

//客户端同步请求
export type RpcClientRequestType = {
	url: string;
	data?: Object;
	retryCount?: number;
	retryInterval?: number;
	timeout?: number; //超时时间
};

//rpc消息失败队列存储
export type RpcFailMsgQueue = {
	sessionId: SessionId;
	msg: RpcMessage; //消息主体
	retryCount: number; //错误重试次数 默认三次
	retryInterval: number; //重试间隔 默认一秒
	expiretime: number; //过期时间
	timeout: number;
	maxRetryCount: number;
	maxRetryInterval: number;
};

//rpc客户端消息存储
export type RpcClientMsgBox = {
	id: number;
	msg: RpcMessage; //消息主体
	retryCount: number; //错误重试次数 默认三次
	retryInterval: number; //重试间隔 默认一秒
	expiretime: number; //过期时间
	timeout: number;
	maxRetryCount: number;
	maxRetryInterval: number;
	cb: TaskAsync; //消息回调函数
};

//服务端盒子存储信息
export type RpcServerMsgBox = {
	id: number;
	cb: TaskAsync; //消息回调函数
	expiretime: number; //过期时间
	timeout: number;
};

export type RpcConfig = {
	list: SocketServerConfig[];
	retry: {
		retryCount: number; //错误重试次数 默认三次
		retryInterval: number; //重试间隔 默认一秒
		maxMsgNum: number; //最大并发数
		timeout: number; //超时时间
	};
};

export type RpcClientConfig = {
	retryCount: number; //错误重试次数 默认三次
	retryInterval: number; //重试间隔 默认一秒
	maxMsgNum: number; //最大并发数
	timeout: number; //超时时间
} & SocketClientConfig;

export type RetryConfig = {
	retryCount?: number;
	retryInterval?: number;
	timeout?: number; //超时时间
	maxMsgNum?: number;
};

export enum RpcResponseCode {
	ok = 200,
	noaccess = 403, //禁止访问
	notfound = 404,
	error = 500,
	retryTimes = 502,
	disconnect = 503,
	timeout = 504,
	busy = 505,
}

export type RpcResponseType = {
	code: RpcResponseCode;
	msg?: string;
	data?: any;
};
