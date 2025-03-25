import { RpcConfig } from "../types/RpcConfig";

//服务端默认配置
export const RpcConnectConfigServer: RpcConfig = {
	list: [],
	retry: {
		retryCount: 3, //错误重试次数 默认三次
		retryInterval: 100, //重试间隔 默认100ms
		maxMsgNum: 100000, //最大消息并发数
		timeout: 1000,
		increase: false,
	},
	limit: {
		//限流默认为关闭状态
		open: false,
		pendingMaxSize: 10000,
		pendingSessionMaxSize: 5000,
	},
	slowRPCInterval: 500,
	cmidTTL: 100,
};

//客户端默认配置
export const RpcConnectConfigClient = {
	retryCount: 3, //错误重试次数 默认三次
	retryInterval: 1000, //重试间隔 默认一秒
	maxMsgNum: 10000, //最大消息瞬时并发数
	timeout: 3000,
	increase: true, //自增长重试
	slowRPCInterval: 500,
	disconnectInterval: 10000, //断线重连十秒
};
