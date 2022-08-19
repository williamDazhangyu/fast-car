import { ClientSession, SocketServerConfig, SocketSession } from "../../../../types/SocketConfig";
import MsgHookService from "../../../MsgHookService";
import SocketServer from "../../SocketServer";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { InteractiveMode, RpcMessage } from "../../../../types/RpcConfig";
import { CallDependency, Log } from "fastcar-core/annotation";
import { FastCarApplication, Logger } from "fastcar-core";
import { SSLConfig } from "fastcar-server";
import { SocketEvents } from "../../../../types/SocketEvents";
import ProtoBuffService from "../../../ProtoBuffService";
import { DecodePBGrpcDefault, EncodePBGrpcDefault } from "../../../../constant/SocketCodingDefault";

export default class GrpcServer extends SocketServer {
	private server!: grpc.Server;

	@Log("rpc")
	private rpcLogger!: Logger;

	@CallDependency
	private app!: FastCarApplication;

	constructor(config: SocketServerConfig, manager: MsgHookService) {
		super(config, manager);
	}

	async listen(): Promise<void> {
		const PROTO_PATH = ProtoBuffService.getRouterRootPath();
		const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
		const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
		const routerProto = protoDescriptor.router as any;

		let server: grpc.Server = new grpc.Server();
		server.addService(routerProto["Router"].service, {
			transferRoute: async (socket: any) => {
				//接收消息
				let metedataMap = socket.metadata.internalRepr;
				let session: ClientSession = this.manager.createSession(this.id);

				let username = metedataMap.get("username")[0];
				if (!username) {
					username = "";
				} else {
					username = username.toString();
				}

				let password = metedataMap.get("password")[0];
				if (!password) {
					password = "";
				} else {
					password = password.toString();
				}

				let flag = await this.manager.auth(username, password, session);
				if (!flag) {
					this.manager.deleteSession(session.sessionId);
					socket.close(3000, "auth fail");
					return;
				}

				let socketId = session.sessionId;
				let remoteAddress = socket?.call?.stream?.session?.socket?.remoteAddress;

				this.connect(socket, socketId, remoteAddress || "0.0.0.0");

				socket.write(
					EncodePBGrpcDefault({
						url: SocketEvents.CONNECT_RECEIPT,
						mode: InteractiveMode.request,
						data: { socketId },
					})
				);

				socket.on("data", (request: any) => {
					this.manager.handleMsg(socketId, DecodePBGrpcDefault(request));
				});

				socket.on("end", () => {
					this.dropConnect(socketId, "client end");
				});
			},
		});

		let ssl: Required<SSLConfig> = this.config.server.ssl as Required<SSLConfig>;
		let { checkClientCertificate } = this.config.extra;
		let netServer = ssl
			? grpc.ServerCredentials.createSsl(
					Buffer.from(this.app.getFileContent(ssl.ca)),
					[
						{
							cert_chain: Buffer.from(this.app.getFileContent(ssl.cert)),
							private_key: Buffer.from(this.app.getFileContent(ssl.key)),
						},
					],
					checkClientCertificate
			  )
			: grpc.ServerCredentials.createInsecure();

		server.bindAsync(`${this.config.server.hostname || "0.0.0.0"}:${this.config.server.port}`, netServer, () => {
			server.start();
			this.rpcLogger.debug(`grpc server started on ${this.config.server.port}`);
		});
		this.server = server;
	}

	async close(): Promise<void> {
		if (!!this.server) {
			this.server.forceShutdown();
		}
	}

	async sendMsg(sessionId: string, msg: RpcMessage): Promise<boolean> {
		let socket = this.getSession(sessionId);
		if (!socket) {
			return false;
		}
		socket.client.write(EncodePBGrpcDefault(msg));
		return true;
	}

	offline(session: SocketSession, reason?: string | undefined): void {
		session.client.end();
	}
}
