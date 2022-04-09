import { SocketServerConfig, SessionId, ClientSession } from "../../../../types/SocketConfig";
import SocketServer from "../../SocketServer";
import { Server, Socket } from "socket.io";
import { SocketEvents } from "../../../../types/SocketEvents";
import MsgHookService from "../../../MsgHookService";

type SocketIOSession = {
	id: SessionId; //会话id
	client: Socket; //连接后的管理对象
	remoteAddress: string; //ip地址
};

export default class IoSocketServer extends SocketServer {
	private server!: Server;
	private sessionMap: Map<string, SessionId>;

	constructor(config: SocketServerConfig, manager: MsgHookService) {
		super(config, manager);
		this.sessionMap = new Map();
	}

	async listen(): Promise<void> {
		this.server = new Server(this.config.extra);
		this.server.listen(this.config.port);

		//预处理连接认证
		this.server.use(async (socket: Socket, next) => {
			let session: ClientSession = this.manager.createSession(this.id);
			let { username, password } = socket.handshake.query;
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

			let flag = await this.manager.auth(username, password, session);
			if (!flag) {
				this.manager.deleteSession(session.sessionId);
				return next(new Error(`socketio authentication  error`));
			}

			this.sessionMap.set(socket.id, session.sessionId);
			next();
		});

		this.server.on(SocketEvents.CONNECT, (socket: Socket) => {
			let socketId = this.sessionMap.get(socket.id) || "";
			console.log("socket id", socket.id);
			if (!socketId) {
				socket.disconnect(true);
				return;
			}

			this.connect(socket, socketId, socket.handshake.address);
			//给客户端发送消息
			socket.emit(SocketEvents.CONNECT_RECEIPT, socketId);
			//监听客户端断开连接的消息
			socket.on(SocketEvents.DISCONNECT, (reason: string) => {
				this.dropConnect(socketId, reason);
			});
			//监听消息
			socket.on(SocketEvents.MESSAGE, (msg: string | Buffer) => {
				this.receiveMsg(socketId, msg);
			});
		});
	}

	async close(): Promise<void> {
		await new Promise((resolve) => {
			this.server.close((err) => {
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
		session.client.disconnect(true);
	}
}
