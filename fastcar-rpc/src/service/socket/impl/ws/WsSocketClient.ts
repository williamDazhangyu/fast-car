import { SocketEnum } from "../../../../constant/SocketEnum";
import { SocketClientConfig } from "../../../../types/SocketConfig";
import MsgClientHookService from "../../../MsgClientHookService";
import { SocketClient } from "../../SocketClient";
import { WebSocket } from "ws";
import { SocketEvents } from "../../../../types/SocketEvents";
import { RpcMessage } from "../../../../types/RpcConfig";

export default class WsSocketClient extends SocketClient {
	type: SocketEnum;
	io!: WebSocket;

	constructor(config: SocketClientConfig, manager: MsgClientHookService) {
		super(config, manager);
		this.type = SocketEnum.WS;
	}

	async connect(): Promise<boolean> {
		return new Promise((resolve) => {
			if (this.connected) {
				this.disconnect();
			}

			let headers = {
				username: this.config.secure?.username || "",
				password: this.config.secure?.password || "",
			};

			if (this.config.extra && this.config.extra.headers) {
				headers = Object.assign({}, this.config.extra.headers, headers);
			}

			const io = new WebSocket(
				this.config.url,
				Object.assign({}, this.config.extra, {
					headers,
				})
			);

			// io.on("open", () => {
			// 	this.connected = true;
			// 	resolve(this.connected);
			// });

			io.on(SocketEvents.CLOSE, () => {
				if (this.connected) {
					this.connected = false;
				}

				resolve(false);
			});

			io.on(SocketEvents.MESSAGE, (msg: string | Buffer) => {
				if (!this.connected) {
					let result: any = this.decode(msg);
					if (!!result && result?.url == SocketEvents.CONNECT_RECEIPT) {
						this.connected = true;
						return resolve(true);
					}
				} else {
					this.receiveMsg(msg);
				}
			});

			io.on("error", (e: any) => {
				this.logger.error("ws error");
				this.logger.error(e.code);
				if (e.code == "ECONNREFUSED") {
					this.disconnect("ws connect refuse");
				}
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

	sendMsg(msg: RpcMessage) {
		if (!this.io || !this.connected) {
			return false;
		}

		this.io.send(this.encode(msg), (err?: Error) => {
			if (err) {
				this.logger.error("send msg fail");
				this.logger.error(err);
			}
		});

		return true;
	}

	receiveMsg(msg: string | Buffer): void {
		this.manager.handleMsg(this.decode(msg));
	}

	offline(reason: string = "offline"): void {
		if (this.io && this.connected) {
			this.disconnect(reason);
		}
	}
	close(reason: string = "close"): void {
		this.offline(reason);
	}
}
