import { SocketServerConfig, SessionId } from "../../../type/SocketConfig";
import SocketServer from "../../SocketServer";
import { Server, Socket } from "socket.io";
import { SocketEvents } from "../../../type/SocketEvents";
import MsgHookService from "../../MsgHookService";

type SocketIOSession = {
	id: SessionId; //会话id
	client: Socket; //连接后的管理对象
};

export default class IoSocketServer extends SocketServer {
	private server!: Server;

	constructor(config: SocketServerConfig, manager: MsgHookService) {
		super(config, manager);
	}

	async listen(): Promise<void> {
		this.server = new Server(this.config.extra);
		this.server.listen(this.config.port);

		this.server.on(SocketEvents.CONNECT, (socket: Socket) => {
			let socketId = this.connect(socket);
			//给客户端发送消息
			socket.emit(SocketEvents.CONNECT, socketId);
			//监听客户端断开连接的消息
			socket.on(SocketEvents.DISCONNECT, (reason: string) => {
				this.dropConnect(socketId, reason);
			});
			//监听消息
			socket.on(SocketEvents.MESSAGE, (msg: string | Buffer[]) => {
				this.receiveMsg(socketId, msg);
			});
		});
	}

	async close(): Promise<void> {
		await new Promise(resolve => {
			this.server.close(err => {
				if (err) {
					console.error(err);
				}
				resolve("OK");
			});
		});
	}

	getSession(sessionId: string) {
		return this.sessions.get(sessionId) as SocketIOSession;
	}

	async sendMsg(sessionId: string, msg: Object): Promise<boolean> {
		let socket = this.getSession(sessionId);
		if (!socket) {
			return false;
		}
		//根据协议转成想要的服务
		socket.client.emit(SocketEvents.MESSAGE, this.encode(msg));
		return true;
	}

	offline(session: SocketIOSession, reason?: string): void {
		session.client.emit("disconnect", reason);
	}
}
