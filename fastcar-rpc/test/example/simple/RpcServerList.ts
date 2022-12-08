import { SocketEnum } from "../../../src/constant/SocketEnum";
import { CodeProtocolEnum } from "../../../src/types/CodeProtocolEnum";
import { SocketServerConfig } from "../../../src/types/SocketConfig";
import * as path from "path";
import { Protocol } from "@fastcar/server";

const serverList: SocketServerConfig[] = [
	{
		id: "rpc-server-1",
		type: SocketEnum.SocketIO,
		server: { port: 1235 },
		extra: {},
		serviceType: "rpc",
	},
	{
		id: "rpc-server-2",
		type: SocketEnum.MQTT,
		server: { port: 1236, protocol: Protocol.net },
		extra: {},
		serviceType: "rpc", //如果是ws则协议连接为http
	},
	{
		id: "rpc-server-3",
		type: SocketEnum.SocketIO,
		server: { port: 1237 },
		extra: {},
		serviceType: "rpc",
		secure: { username: "user", password: "123456" }, //连接前进行校验
	},
	{
		id: "rpc-server-4",
		type: SocketEnum.WS,
		server: { port: 1238 },
		serviceType: "rpc",
	},
	{
		id: "rpc-server-5",
		type: SocketEnum.MQTT,
		server: {
			port: 1239,
			protocol: Protocol.https,
			ssl: {
				key: "./ssl/localhost-key.pem",
				cert: "./ssl/localhost-cert.crt",
			},
		},
		serviceType: "rpc",
	},
	{
		id: "rpc-server-6",
		type: SocketEnum.Grpc,
		server: {
			port: 1240,
			ssl: {
				ca: path.join(__dirname, "../resource/cert/ca.crt"),
				key: path.join(__dirname, "../resource/cert/server.key"),
				cert: path.join(__dirname, "../resource/cert/server.crt"),
			},
		},
		serviceType: "rpc",
		codeProtocol: CodeProtocolEnum.PROTOBUF,
		extra: {
			checkClientCertificate: true,
		},
	},
];

export default {
	rpc: {
		list: serverList,
	},
};
