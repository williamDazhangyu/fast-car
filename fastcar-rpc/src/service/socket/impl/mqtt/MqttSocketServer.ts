import { SocketServerConfig, SessionId, ClientSession } from "../../../../types/SocketConfig";
import SocketServer from "../../SocketServer";
import { SocketEvents } from "../../../../types/SocketEvents";
import MsgHookService from "../../../MsgHookService";
import { Server, Client, PublishPacket, Aedes } from "aedes";
import * as net from "net";

type SocketMqttSession = {
	id: SessionId; //会话id
	client: Client; //连接后的管理对象
	remoteAddress: string; //ip地址
};

export default class MqttSocketServer extends SocketServer {
	private server!: Aedes;
	private tcpServer!: net.Server;
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
				console.log("id----", client.id);
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
					this.receiveMsg(sessionId, packet.payload.toString());
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

		//监听放到最后  判断是否为ssl协议的
		this.tcpServer = net.createServer(this.server.handle);
		this.tcpServer.listen(this.config.port);
	}

	async close(): Promise<void> {
		await new Promise((resolve) => {
			this.server.close();
			this.tcpServer.close(() => {
				resolve("OK");
			});
		});
	}

	getSession(sessionId: string) {
		return this.sessions.get(sessionId) as SocketMqttSession;
	}

	async sendMsg(sessionId: string, msg: Object): Promise<boolean> {
		let socket = this.getSession(sessionId);
		if (!socket) {
			return false;
		}

		return new Promise((resolve) => {
			//根据协议转成想要的服务
			let content = this.encode(msg);
			if (typeof content != "string") {
				content = content.toString();
			}
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
