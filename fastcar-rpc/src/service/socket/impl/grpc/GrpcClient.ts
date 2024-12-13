import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { SocketEnum } from "../../../../constant/SocketEnum";
import { SocketClientConfig } from "../../../../types/SocketConfig";
import MsgClientHookService from "../../../MsgClientHookService";
import { SocketClient } from "../../SocketClient";
import { SocketEvents } from "../../../../types/SocketEvents";
import { RpcMessage } from "../../../../types/RpcConfig";

import { DecodePBGrpcDefault, EncodePBGrpcDefault } from "../../../../constant/SocketCodingDefault";
import { SSLConfig } from "@fastcar/server";
import * as fs from "fs";
import { Autowired, DemandInjection } from "@fastcar/core/annotation";
import ProtoBuffService from "../../../ProtoBuffService";

@DemandInjection
export default class GrpcClient extends SocketClient {
	type: SocketEnum;
	io!: any;

	@Autowired
	private protoBuffService!: ProtoBuffService;

	constructor(config: SocketClientConfig, manager: MsgClientHookService) {
		super(config, manager);
		this.type = SocketEnum.Grpc;
	}

	async connect(): Promise<boolean> {
		return new Promise((resolve) => {
			if (this.connected) {
				this.disconnect();
			}

			const PROTO_PATH = this.protoBuffService.getRouterRootPath();
			const packageDefinition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
			const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
			const routerProto = protoDescriptor.router as any;

			let metadata = new grpc.Metadata();
			metadata.set("username", this.config.secure?.username || "");
			metadata.set("password", this.config.secure?.password || "");

			let ssl: Required<SSLConfig> = this.config.ssl as Required<SSLConfig>;
			let options: {
				"grpc.ssl_target_name_override": string;
				"grpc.default_authority": string;
			} = this.config.extra?.options || {};

			let instance = ssl ? grpc.credentials.createSsl(fs.readFileSync(ssl.ca), fs.readFileSync(ssl.key), fs.readFileSync(ssl.cert)) : grpc.ChannelCredentials.createInsecure();
			let client = new routerProto.Router(`${this.config.url}`, instance, options);

			const io = client.transferRoute(metadata);

			io.on("data", (response: RpcMessage) => {
				if (!this.connected) {
					let result: any = DecodePBGrpcDefault(response);
					if (!!result && result?.url == SocketEvents.CONNECT_RECEIPT) {
						this.connected = true;
						return resolve(this.connected);
					}
				} else {
					this.receiveMsg(response);
				}
			});

			io.on("end", () => {
				if (this.connected) {
					this.disconnect();
				}
				resolve(false);
			});

			this.forceConnect = false;
			this.io = io;
		});
	}

	disconnect(reason?: string): void {
		if (this.connected) {
			this.connected = false;
			this.io.end();
		}
	}

	async sendMsg(msg: RpcMessage): Promise<boolean> {
		if (!this.io || !this.connected) {
			return false;
		}

		return new Promise((resolve) => {
			try {
				this.io.write(EncodePBGrpcDefault(msg));
				resolve(true);
			} catch (err) {
				if (err) {
					this.logger.error("send msg fail");
					this.logger.error(err);
				}
				resolve(!err);
			}
		});
	}

	receiveMsg(msg: RpcMessage): void {
		this.manager.handleMsg(DecodePBGrpcDefault(msg));
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
