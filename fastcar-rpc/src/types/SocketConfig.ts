import { ServerConfig, SSLConfig } from "@fastcar/server";
import { SocketEnum } from "../constant/SocketEnum";
import { CodeProtocolEnum } from "./CodeProtocolEnum";
import { RpcMessage } from "./RpcConfig";
export type SessionId = string;
export type ServerId = string;
export type CustomId = string; //程序自定义id

export type SecureClientOptions = {
	username: string;
	password: string;
};

//长连接配置
export type SocketClientConfig = {
	url: string; //连接地址
	type: SocketEnum; //具体为哪一种型号的连接器
	extra?: any; //第三方拓展参数
	encode?: EncodeMsg; //解码器
	decode?: DecodeMsg;
	disconnectInterval?: number;
	secure?: SecureClientOptions;
	ssl?: SSLConfig;
	connectionLimit?: number; //连接数限制 默认1
	timeout?: number; //超时时间
	slowRPCInterval?: number; //慢sql检测 默认500ms延迟
	increase?: boolean; //消息延长发送模式 默认为true 在true模式下每次重试间隔为
} & { [key: string]: any };

//服务端连接配置
export type SocketServerConfig = {
	id: string; //编号名称
	type: SocketEnum; //具体为哪一种型号的连接器
	server: ServerConfig;
	extra?: any; //第三方拓展配置 用于灵活的调用第三方
	serviceType: string; //服务器用途类型 用于表名是何种服务器
	encode?: EncodeMsg; //编码解码
	decode?: DecodeMsg;
	codeProtocol?: CodeProtocolEnum; //约定协议 json protobuf
	secure?: SecureClientOptions;
	maxConnections?: number; //最大连接数 默认1024
	timeout?: number; //空闲超时时间 针对ws和grpc有效
} & { [key: string]: any };

//客户端连接至服务的会话
export type SocketSession = {
	id: SessionId; //会话id
	client: any; //连接后的管理对象
	remoteAddress: string; //ip地址
};

//掉线退出理由
export type SocketDisConnect = {
	sessionId: string;
	reason?: string;
};

//客户端会话值
export type ClientSession = {
	sessionId: string;
	serverId: string;
	connectedTime: number; //连接的开始时间
	settings: Map<string | symbol, any>; //自定义设置项
	cid?: CustomId; //自定义逻辑id
	channels?: Set<string>; //频道
};

//压缩消息
export type EncodeMsg = (msg: RpcMessage) => string | Buffer;

//解压消息
export type DecodeMsg = (msg: string | Buffer | ArrayBuffer | Buffer[]) => RpcMessage;
