import { SocketEnum } from "../../../../constant/SocketEnum";
import { SocketClientConfig } from "../../../../types/SocketConfig";
import MsgClientHookService from "../../../MsgClientHookService";
import { SocketClient } from "../../SocketClient";
import { WebSocket } from "ws";
import { SocketEvents } from "../../../../types/SocketEvents";

export default class WsSocketClient extends SocketClient {
	type: SocketEnum;
	io!: WebSocket;

	constructor(config: SocketClientConfig, manager: MsgClientHookService) {
		super(config, manager);
		this.type = SocketEnum.WS;
	}

	connect(): void {
		if (this.connected) {
			this.disconnect();
		}

		const io = new WebSocket(
			this.config.url,
			Object.assign({}, this.config.extra, {
				headers: {
					username: this.config.secure?.username || "",
					password: this.config.secure?.password || "",
				},
			})
		);
		io.on(SocketEvents.CLOSE, () => {
			if (this.connected) {
				this.connected = false;
			}
		});

		io.on(SocketEvents.MESSAGE, (msg: string | Buffer) => {
			this.receiveMsg(msg);
		});

		this.forceConnect = false;
		this.io = io;
	}

	disconnect(reason?: string): void {
		this.connected = false;
		this.io.close();
		this.logger.warn(`client disconnect ${reason}`);
	}

	async sendMsg(msg: Object): Promise<boolean> {
		if (!this.io || !this.connected) {
			return false;
		}

		return new Promise((resolve) => {
			this.io.send(this.encode(msg), (err?: Error) => {
				if (err) {
					this.logger.error("send msg fail");
					this.logger.error(err);
				}
				resolve(!err);
			});
		});
	}

	receiveMsg(msg: string | Buffer): void {
		let data: any = this.decode(msg);
		if (!!data && data?.event) {
			if (data.event == SocketEvents.CONNECT_RECEIPT) {
				this.sessionId = data.socketId;
				this.connected = true;
				return;
			}
		}
		this.manager.handleMsg(data);
	}

	offline(reason?: string): void {
		if (this.io && this.connected) {
			this.disconnect(reason);
		}
	}
	close(): void {
		this.offline();
	}
}
