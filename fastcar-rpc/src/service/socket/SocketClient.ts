import { Logger } from "fastcar-core";
import { Log } from "fastcar-core/annotation";
import { DecodeDefault, EncodeDefault } from "../../constant/SocketCodingDefault";
import { SocketEnum } from "../../constant/SocketEnum";
import { DecodeMsg, EncodeMsg, SessionId, SocketClientConfig } from "../../types/SocketConfig";
import MsgClientHookService from "../MsgClientHookService";

//公用的socket
export abstract class SocketClient {
	abstract type: SocketEnum; //实现类型
	protected encode: EncodeMsg;
	protected decode: DecodeMsg;
	sessionId: SessionId; //客户端编号
	connected: boolean; //是否已经连接
	config: SocketClientConfig;
	manager: MsgClientHookService;
	forceConnect: boolean; //是否为强制下线

	@Log("socket")
	protected logger!: Logger;

	constructor(config: SocketClientConfig, manager: MsgClientHookService) {
		this.sessionId = "";
		this.connected = false;
		this.config = config;
		this.manager = manager;

		//解码器赋值
		this.encode = config.encode || EncodeDefault;
		this.decode = config.decode || DecodeDefault;
		this.forceConnect = false;
	}

	getType() {
		return this.config.type;
	}

	abstract connect(): void;

	abstract disconnect(reason: string): void;

	//发送消息
	abstract sendMsg(msg: Object): Promise<boolean>;

	//接收消息
	abstract receiveMsg(msg: string | Buffer): void;

	//客户端主动下线
	abstract offline(reason?: string): void;

	abstract close(): void;
}
