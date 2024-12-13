import { SocketEnum } from "../../../../constant/SocketEnum";
import { SocketClientConfig } from "../../../../types/SocketConfig";
import { SocketClient } from "../../../socket/SocketClient";
import * as ioClient from "socket.io-client";
import MsgClientHookService from "../../../MsgClientHookService";
import { SocketEvents } from "../../../../types/SocketEvents";
import { RpcMessage } from "../../../../types/RpcConfig";

export default class IoSocketClient extends SocketClient {
	type: SocketEnum;
	io!: ioClient.Socket;

	constructor(config: SocketClientConfig, manager: MsgClientHookService) {
		super(config, manager);
		config.extra = Object.assign({}, { forceNew: true, transports: ["websocket"] }, config.extra, {
			query: {
				username: config.secure?.username,
				password: config.secure?.password,
			},
		});
		this.type = SocketEnum.SocketIO;
	}

	async connect(): Promise<boolean> {
		return new Promise((resolve) => {
			if (this.connected) {
				this.disconnect();
			}

			const io = ioClient.connect(this.config.url, this.config.extra);

			io.on(SocketEvents.CONNECT_RECEIPT, (socketId: string) => {
				this.connected = true;
				resolve(true);
			});

			io.on(SocketEvents.DISCONNECT, () => {
				if (this.connected) {
					this.connected = false;
					// this.disconnect();
				}

				resolve(false);
			});

			io.on(SocketEvents.MESSAGE, (msg: string | Buffer) => {
				this.receiveMsg(msg);
			});

			this.forceConnect = false;
			this.io = io;
		});
	}

	disconnect(reason?: string): void {
		this.connected = false;
		this.io.close();
		this.logger.warn(`client disconnect ${reason}`);
	}

	sendMsg(msg: RpcMessage): void {
		if (this.connected) {
			this.io.emit(SocketEvents.MESSAGE, this.encode(msg));
		}
	}

	receiveMsg(msg: string | Buffer): void {
		//协议进行解析
		this.manager.handleMsg(this.decode(msg));
	}

	offline(reason: string = "offline"): void {
		if (this.io && this.connected) {
			this.disconnect(reason);
		}
	}

	close(reason: string = "close"): void {
		if (this.io) {
			this.disconnect(reason);
		}
	}
}
