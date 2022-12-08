import { SocketServerConfig, SessionId, ClientSession } from "../../../../types/SocketConfig";
import SocketServer from "../../SocketServer";
import { SocketEvents } from "../../../../types/SocketEvents";
import MsgHookService from "../../../MsgHookService";
import { Server, Client, PublishPacket, Aedes } from "aedes";
import { Protocol } from "@fastcar/server";
import * as net from "net";
import { RpcMessage } from "../../../../types/RpcConfig";

type SocketMqttSession = {
	id: SessionId; //会话id
	client: Client; //连接后的管理对象
	remoteAddress: string; //ip地址
};

export default class MqttSocketServer extends SocketServer {
	private server!: Aedes;
	private sessionMap: Map<string, SessionId>;

	constructor(config: SocketServerConfig, manager: MsgHookService) {
		super(config, manager);
		if (!this.config.secure) {
			this.config.secure = {
				username: "",
				password: "",
			};
		}
		this.sessionMap = new Map();
	}

	async listen(): Promise<void> {
		this.server = Server({
			id: this.config.id,
			authenticate: (client, username, password, callback) => {
				//创建一个会话
				let session: ClientSession = this.manager.createSession(this.id);
				this.manager.auth(username, password.toString(), session).then((res: boolean) => {
					if (!res) {
						this.manager.deleteSession(session.sessionId);
					}
					this.sessionMap.set(client.id, session.sessionId);
					callback(null, res);
				});
			},
			authorizePublish: (client: Client, packet: PublishPacket) => {
				let sessionId = this.sessionMap.get(client.id);
				if (sessionId) {
					this.receiveMsg(sessionId, packet.payload);
				}
			},
		});

		this.server.on("client", (socket: Client) => {
			let remoteAddress = "0.0.0.0";
			if (socket.conn instanceof net.Socket) {
				remoteAddress = socket.conn.remoteAddress || "0.0.0.0";
			}

			let socketId = this.sessionMap.get(socket.id);
			if (!socketId) {
				return;
			}

			//给客户端发送消息
			this.connect(socket, socketId, remoteAddress);
			socket.publish(
				{
					topic: SocketEvents.CONNECT_RECEIPT,
					payload: socketId,
					cmd: "publish",
					qos: 0,
					retain: true,
					dup: false,
				},
				() => {}
			);
		});

		//监听客户端断开连接的消息
		this.server.on("clientDisconnect", (client: Client) => {
			let sessionId = this.sessionMap.get(client.id);
			if (sessionId) {
				this.dropConnect(sessionId, "client disconnect");
				this.sessionMap.delete(client.id);
			}
		});

		if (this.config.server.protocol == Protocol.http || this.config.server.protocol == Protocol.https) {
			let httpServer = this.manager.createNetServer(this.config.server);
			const ws = require("websocket-stream");
			ws.createServer({ server: httpServer }, this.server.handle);
		} else {
			this.manager.createNetServer(this.config.server, this.server.handle);
		}
	}

	async close(): Promise<void> {
		await new Promise((resolve) => {
			this.server.close(() => {
				resolve("OK");
			});
		});
	}

	getSession(sessionId: string) {
		return this.sessions.get(sessionId) as SocketMqttSession;
	}

	async sendMsg(sessionId: string, msg: RpcMessage): Promise<boolean> {
		let socket = this.getSession(sessionId);
		if (!socket) {
			return false;
		}

		return new Promise((resolve) => {
			//根据协议转成想要的服务
			let content = this.encode(msg);
			socket.client.publish(
				{
					topic: "message",
					payload: content,
					cmd: "publish",
					qos: 0,
					retain: false,
					dup: false,
				},
				(err?: Error) => {
					resolve(!err);
				}
			);
		});
	}

	offline(session: SocketMqttSession, reason?: string): void {
		session.client.close();
	}
}
