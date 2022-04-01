import { SocketEnum } from "../../constant/SocketEnum";
import { DecodeMsg, EncodeMsg, SessionId, SocketClientConfig, SocketSession, EncodeDefault, DecodeDefault } from "../../type/SocketConfig";
import MsgHookService from "../MsgHookService";

//公用的socket
export abstract class SocketClient {
	abstract type: SocketEnum; //实现类型
	protected encode: EncodeMsg;
	protected decode: DecodeMsg;
	sessionId: SessionId; //客户端编号
	connected: boolean; //是否已经连接
	config: SocketClientConfig;
	manager: MsgHookService;

	constructor(config: SocketClientConfig, manager: MsgHookService) {
		this.sessionId = "";
		this.connected = false;
		this.config = config;
		this.manager = manager;

		//解码器赋值
		this.encode = config.encode || EncodeDefault;
		this.decode = config.decode || DecodeDefault;
	}

	getType() {
		return this.config.type;
	}

	abstract connect(uri: string, opts?: any): void;

	abstract disconnect(reason: string): void;

	//发送消息
	abstract sendMsg(msg: Object): boolean;

	//接收消息
	abstract receiveMsg(msg: string | Buffer[]): void;

	//客户端主动下线
	abstract offline(reason?: string): void;
}
