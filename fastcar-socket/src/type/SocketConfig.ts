import { SocketEnum } from "../constant/SocketEnum";
export type SessionId = string;
export type ServerId = string;

//长连接配置
export type SocketClientConfig = {
	uri: string; //连接地址
	encode?: EncodeMsg; //解码器
	decode?: DecodeMsg;
	extra?: any; //第三方拓展参数
} & { [key: string]: any };

//服务端连接配置
export type SocketServerConfig = {
	id: string; //编号名称
	type: SocketEnum; //具体为哪一种型号的连接器
	port: number;
	extra?: any; //第三方拓展配置 用于灵活的调用第三方
	encode?: EncodeMsg;
	decode?: DecodeMsg;
} & { [key: string]: any };

//客户端连接至服务的会话
export type SocketSession = {
	id: SessionId; //会话id
	client: any; //连接后的管理对象
};

//掉线退出理由
export type SocketDisConnect = {
	sessionId: string;
	reason?: string;
};

//客户端端回话值
export type ClientSession = {
	sessionId: string;
	serverId: string;
	connectedTime: number; //连接的开始时间
	settings: Map<string | symbol, any>; //自定义设置项
};

//事件标记值
export const SocketSymbol = {
	SocketEntryService: Symbol("SocketEntryService"),
	SocketMsgService: Symbol("SocketMsgService"),
};

//压缩消息
export type EncodeMsg = (msg: Object) => string | Buffer[];

//解压消息
export type DecodeMsg = (msg: string | Buffer[]) => Object;

export const EncodeDefault: EncodeMsg = (msg: Object) => {
	return JSON.stringify(msg);
};

export const DecodeDefault: DecodeMsg = (msg: string | Buffer[]) => {
	if (typeof msg == "string") {
		return JSON.parse(msg);
	}

	return msg;
};
