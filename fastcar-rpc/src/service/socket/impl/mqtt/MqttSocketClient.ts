import * as mqtt from "mqtt";
import { SocketEnum } from "../../../../constant/SocketEnum";
import { SocketClientConfig } from "../../../../types/SocketConfig";
import MsgClientHookService from "../../../MsgClientHookService";
import { SocketClient } from "../../SocketClient";
import { SocketEvents } from "../../../../types/SocketEvents";
import { RpcMessage } from "../../../../types/RpcConfig";

export default class MqttSocketClient extends SocketClient {
	type: SocketEnum;
	io!: mqtt.MqttClient;

	constructor(config: SocketClientConfig, manager: MsgClientHookService) {
		super(config, manager);
		config.extra = Object.assign({}, config.extra);
		this.type = SocketEnum.MQTT;
	}

	connect(): void {
		//默认没有用户名和密码
		if (!this.config.secure) {
			this.config.secure = {
				username: "",
				password: "",
			};
		}

		const io = mqtt.connect(this.config.url, Object.assign({ reconnecting: true }, this.config.extra, this.config.secure));

		io.on(SocketEvents.CONNECT, () => {
			this.connected = true;
		});

		io.on(SocketEvents.MESSAGE, (topic: string, message: string | Buffer) => {
			if (topic == SocketEvents.CONNECT_RECEIPT) {
				this.connected = true;
				this.sessionId = message.toString();
			} else {
				this.receiveMsg(message);
			}
		});

		io.on("error", (error: any) => {
			// this.disconnect(packet.reasonCode?.toString());
			let code = error.code;
			if (this.connected) {
				if (code == "ECONNRESET" || code == "ECONNREFUSED") {
					this.connected = false;
				}
			}
		});
		this.io = io;
		this.forceConnect = false;
	}

	disconnect(reason?: string): void {
		this.connected = false;
		this.io.end();
		this.logger.warn(`client disconnect ${reason}`);
	}

	async sendMsg(msg: RpcMessage): Promise<boolean> {
		if (!this.connected) {
			return false;
		}

		return new Promise((resolve) => {
			this.io.publish(SocketEvents.MESSAGE, this.encode(msg), (error?: Error) => {
				resolve(!error);
			});
		});
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
		if (this.io) {
			this.disconnect(reason);
		}
	}
}
