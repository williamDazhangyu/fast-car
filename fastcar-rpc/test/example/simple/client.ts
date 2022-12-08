import { SocketEnum } from "../../../src/constant/SocketEnum";
import RpcServer from "../../../src/service/rpc/RpcServer";
import { ServerApplication } from "@fastcar/server";
import { EncodePBDefault, DecodeDefault, DecodePBDefault } from "../../../src/constant/SocketCodingDefault";
import { CodeProtocolEnum } from "../../../src/types/CodeProtocolEnum";
import RpcClient from "../../../src/service/rpc/RpcClient";
import RpcAsyncService from "../../../src/service/RpcAsyncService";
import ProtoBuffService from "../../../src/service/ProtoBuffService";
import * as path from "path";
import * as grpc from "@grpc/grpc-js";
import { ClientRequestStatic } from "../../../src/service/rpc/RequestStatic";

type HelloPBRequest = {
	message: string;
};

type HelloPBReply = {
	code: number;
	data: string;
};

class NotifyHandle implements RpcAsyncService {
	async handleMsg(url: string, data: Object): Promise<void | Object> {
		console.log("收到服务端消息", url, data);
		return {
			url,
			data: "来自客户端的消息---",
		};
	}
}

describe("rpc交互测试", () => {
	it("服务端和客户端交互", async () => {
		let client1 = new RpcClient(
			{
				// url: "ws://localhost:1235",
				// type: SocketEnum.SocketIO,
				// url: "mqtt://localhost:1236",
				// type: SocketEnum.MQTT,
				url: "ws://localhost:1238",
				type: SocketEnum.WS,
				secure: { username: "user", password: "123456" },
			},
			new NotifyHandle()
		);
		await client1.start();
		let result = await client1.request("/hello");
		console.log("普通调用", result);
		let result2 = await client1.request("/head/hello");
		console.log("追加了head的url", result2);
		let sessionId = client1.getSessionId();
		// let server: RpcServer = appInstance.app.getComponentByTarget(RpcServer);
		// let result3 = await server.request(sessionId, "/server/test", "发送至客户端");
		// console.log("服务端收到客户端应答", result3);
		let result4 = await client1.request("/asynchello");
		console.log("普通调用", result4);
	});
	it("客户端主动断开连接", async () => {
		let client2 = new RpcClient(
			{
				// url: "ws://localhost:1235",
				// type: SocketEnum.SocketIO,
				// url: "mqtt://localhost:1236",
				// type: SocketEnum.MQTT,
				url: "ws://localhost:1238",
				type: SocketEnum.WS,
			},
			new NotifyHandle()
		);
		await client2.start();
		client2.stop("客户端主动关闭");
	});
	it("服务端主动断开客户端连接", async () => {
		let client3 = new RpcClient(
			{
				// url: "ws://localhost:1235",
				// type: SocketEnum.SocketIO,
				// url: "mqtt://localhost:1236",
				// type: SocketEnum.MQTT,
				url: "ws://localhost:1238",
				type: SocketEnum.WS,
			},
			new NotifyHandle()
		);
		await client3.start();
		let sessionId = client3.getSessionId();
		// setTimeout(() => {
		// 	let server: RpcServer = appInstance.app.getComponentByTarget(RpcServer);
		// 	server.kickSessionId(sessionId, "服务端强制客户端下线");
		// }, 1000);
	});
	it("服务端断线重连", async () => {
		let client4 = new RpcClient(
			{
				// url: "ws://localhost:1235",
				// type: SocketEnum.SocketIO,
				url: "mqtt://localhost:1236",
				type: SocketEnum.MQTT,
				retryCount: 3, //错误重试次数 默认三次
				retryInterval: 100, //重试间隔 默认一秒
				maxMsgNum: 10000, //最大消息并发数
				timeout: 3000,
				disconnectInterval: 1000,
			},
			new NotifyHandle()
		);
		await client4.start();
		// let server: RpcServer = appInstance.app.getComponentByTarget(RpcServer);
		// let netServer: any = appInstance.app.getComponentByTarget(ServerApplication);
		// await server.stop();
		// await netServer.stop();
		// setTimeout(async () => {
		// 	await server.start();
		// 	netServer.start();
		// }, 3000);
		setTimeout(async () => {
			try {
				let result = await client4.request("/hello");
				console.log(result);
			} catch (e) {
				console.log(e);
			}
		}, 2000);
	});
	it("连接认证测试", async () => {
		let client1 = new RpcClient(
			{
				url: "ws://localhost:1237",
				type: SocketEnum.SocketIO,
				retryCount: 3, //错误重试次数 默认三次
				retryInterval: 100, //重试间隔 默认一秒
				maxMsgNum: 10000, //最大消息并发数
				timeout: 3000,
				disconnectInterval: 1000,
			},
			new NotifyHandle()
		);
		let connect1 = await client1.start();
		console.assert(connect1 == true);
		if (!connect1) {
			client1.close();
		}
		let client2 = new RpcClient(
			{
				url: "ws://localhost:1237",
				type: SocketEnum.SocketIO,
				retryCount: 3, //错误重试次数 默认三次
				retryInterval: 100, //重试间隔 默认一秒
				maxMsgNum: 10000, //最大消息并发数
				timeout: 3000,
				disconnectInterval: 1000,
				secure: {
					username: "user",
					password: "123456",
				},
			},
			new NotifyHandle()
		);
		let connect2 = await client2.start();
		console.assert(connect2 == true);
	});
	it("ssl 测试", async () => {
		let client1 = new RpcClient(
			{
				url: "wss://localhost:1239",
				type: SocketEnum.MQTT,
				extra: {
					rejectUnauthorized: false,
				},
			},
			new NotifyHandle()
		);
		await client1.start();
		let result = await client1.request("/hello");
		console.log("普通调用", result);
	});
	it("protobuff格式传输示例", async () => {
		let client1 = new RpcClient(
			{
				url: "local.dev.com:1240",
				type: SocketEnum.Grpc,
				codeProtocol: CodeProtocolEnum.PROTOBUF,
				ssl: {
					ca: path.join(__dirname, "../resource/cert/ca.crt"),
					key: path.join(__dirname, "../resource/cert/client.key"),
					cert: path.join(__dirname, "../resource/cert/client.crt"),
				},
				extra: {
					options: {
						"grpc.ssl_target_name_override": "example", //这边
						"grpc.default_authority": "example",
					},
				},
			},
			new NotifyHandle(),
			{
				retryCount: 0,
			}
		);

		client1.addProtoBuf({
			root: {
				protoPath: path.join(__dirname, "../../demo.proto"),
				service: "HelloPBController", //服务
			},
			// list: [
			// 	{
			// 		method: "pbhello",
			// 		url: "/pbhello",
			// 	},
			// ],
		});
		await client1.start();
		//优雅的调用请求
		let result = await ClientRequestStatic<HelloPBRequest, HelloPBReply>({
			url: "/pbhello",
			data: {
				message: "来自客户端的pb调用",
			},
			client: client1,
		});
		console.log("返回数据", result.data);
	});
});
