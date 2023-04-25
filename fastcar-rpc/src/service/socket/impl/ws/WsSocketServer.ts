import { ClientSession, SessionId, SocketSession } from "../../../../types/SocketConfig";
import SocketServer from "../../SocketServer";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { SocketEvents } from "../../../../types/SocketEvents";
import { RpcMessage, InteractiveMode } from "../../../../types/RpcConfig";

type SocketIOSession = {
	id: SessionId; //会话id
	client: WebSocket; //连接后的管理对象
	remoteAddress: string; //ip地址
};

export default class WsSocketServer extends SocketServer {
	private server!: WebSocketServer;

	async listen(): Promise<void> {
		let netServer: any = this.manager.createNetServer(this.config.server);
		this.server = new WebSocketServer(Object.assign({}, { server: netServer }, this.config.extra));

		this.server.on("connection", async (socket: WebSocket, request: IncomingMessage) => {
			//进行校验
			let session: ClientSession = this.manager.createSession(this.id);
			let { username, password } = request.headers;
			if (!username) {
				username = "";
			} else {
				username = username.toString();
			}
			if (!password) {
				password = "";
			} else {
				password = password.toString();
			}

			let flag = await this.manager.auth(username, password, session, request);
			if (!flag) {
				this.manager.deleteSession(session.sessionId);
				socket.close(3000, "auth fail");
				return;
			}

			let socketId = session.sessionId;
			this.connect(socket, socketId, request.socket.remoteAddress || "0.0.0.0");
			socket.send(
				this.encode({
					url: SocketEvents.CONNECT_RECEIPT,
					mode: InteractiveMode.request,
					data: { socketId },
				})
			);

			socket.on(SocketEvents.MESSAGE, (data) => {
				this.receiveMsg(socketId, data);
			});

			socket.on("close", (code: number, reason: Buffer) => {
				this.dropConnect(socketId, code + " " + reason.toString());
			});
		});
	}

	async close(): Promise<void> {
		await new Promise((resolve) => {
			this.server.close((err) => {
				if (err) {
					this.manager.getLogger().error(err);
				}
				resolve("OK");
			});
		});
	}

	async sendMsg(sessionId: string, msg: RpcMessage): Promise<boolean> {
		let socket = this.getSession(sessionId);
		if (!socket) {
			return false;
		}
		// console.debug("服务端发送消息模式", msg.mode);
		socket.client.send(this.encode(msg));
		return true;
	}

	getSession(sessionId: string) {
		return this.sessions.get(sessionId) as SocketIOSession;
	}

	offline(session: SocketSession, reason?: string): void {
		session.client.close(3001, "Server forced shutdown");
	}
}
