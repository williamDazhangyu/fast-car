import { SocketEnum } from "../../../constant/SocketEnum";
import { SocketClientConfig } from "../../../type/SocketConfig";
import { SocketClient } from "../../socket/SocketClient";
import * as ioClient from "socket.io-client";
import { SocketEvents } from "../../../type/SocketEvents";
import MsgHookClient from "../../MsgHookService";

export default class IoSocketClient extends SocketClient {
	type: SocketEnum;
	io!: ioClient.Socket;

	constructor(config: SocketClientConfig, manager: MsgHookClient) {
		super(config, manager);
		config.extra = Object.assign({}, { forceNew: true, transports: ["websocket"] }, config.extra);
		this.type = SocketEnum.SocketIO;
	}

	connect(): void {
		const io = ioClient.connect(this.config.uri, this.config.extra);

		io.on(SocketEvents.CONNECT, (socketId: string) => {
			this.sessionId = socketId;
			this.connected = true;
			this.manager.connect(socketId);
		});

		io.on(SocketEvents.DISCONNECT, (reason: string) => {
			if (this.connected) {
				this.disconnect(reason);
			}
		});

		io.on(SocketEvents.MESSAGE, (msg: string | Buffer[]) => {
			this.receiveMsg(msg);
		});

		this.io = io;
	}

	disconnect(reason: string): void {
		this.connected = false;
		this.manager.disconnect(this.sessionId, reason);
	}

	sendMsg(msg: Object): boolean {
		if (!this.connected) {
			return false;
		}

		this.io.emit(SocketEvents.MESSAGE, this.encode(msg));
		return true;
	}

	receiveMsg(msg: string | Buffer[]): void {
		//协议进行解析
		this.manager.handleMsg(this.sessionId, this.decode(msg));
	}

	offline(reason?: string): void {
		if (this.io && this.connected) {
			this.connected = false;
			this.io.emit("disconnect", reason);
		}
	}
}
