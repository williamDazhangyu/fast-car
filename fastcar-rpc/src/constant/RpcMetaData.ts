export const RpcMetaData = {
	RPCMIDDLEWARE: Symbol("RPC_MIDDLEWARE"),
	SocketServerConfig: "socketServer", //服务器配置
	SocketClientConfig: "socketClient", //客户端配置
	RpcConfig: "rpc", //rpc 配置
	RPCMethod: Symbol("RPC_Method"), //rpc路由
	RPCErrorService: "RPC_ErrorService", //捕捉错误服务
	RPCAuthService: "RPC_AuthService", //rpc连接验证
};
