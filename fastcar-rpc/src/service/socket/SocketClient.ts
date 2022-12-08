import { Logger } from "@fastcar/core";
import { Log } from "@fastcar/core/annotation";
import { DecodeDefault, DecodePBDefault, EncodeDefault, EncodePBDefault } from "../../constant/SocketCodingDefault";
import { SocketEnum } from "../../constant/SocketEnum";
import { CodeProtocolEnum } from "../../types/CodeProtocolEnum";
import { RpcMessage } from "../../types/RpcConfig";
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
		switch (config.codeProtocol) {
			case CodeProtocolEnum.PROTOBUF: {
				this.encode = EncodePBDefault;
				this.decode = DecodePBDefault;
				break;
			}
			case CodeProtocolEnum.JSON:
			default: {
				this.encode = EncodeDefault;
				this.decode = DecodeDefault;
				break;
			}
		}

		if (config.encode) {
			this.encode = config.encode;
		}

		if (config.decode) {
			this.decode = config.decode;
		}
		this.forceConnect = false;
	}

	getType() {
		return this.config.type;
	}

	abstract connect(): void;

	abstract disconnect(reason: string): void;

	//发送消息
	abstract sendMsg(msg: RpcMessage): Promise<boolean>;

	//接收消息
	abstract receiveMsg(msg: string | Buffer | RpcMessage): void;

	//客户端主动下线
	abstract offline(reason?: string): void;

	abstract close(reason?: string): void;
}
