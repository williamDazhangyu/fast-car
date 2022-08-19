import { SocketEnum } from "../../constant/SocketEnum";
import { SocketClientConfig, SocketServerConfig } from "../../types/SocketConfig";
import MsgClientHookService from "../MsgClientHookService";
import MsgHookService from "../MsgHookService";
import { SocketClient } from "./SocketClient";
import SocketServer from "./SocketServer";

interface SocketServerInterface<T> {
	new (config: SocketServerConfig, manager: MsgHookService): T;
}

interface SocketClientInterface<T> {
	new (config: SocketClientConfig, manager: MsgClientHookService): T;
}

//仅按需加载模块
export function SocketServerFactory(type: SocketEnum): SocketServerInterface<SocketServer> {
	switch (type) {
		case SocketEnum.SocketIO: {
			return require("./impl/io/IoSocketServer").default;
		}
		case SocketEnum.MQTT: {
			return require("./impl/mqtt/MqttSocketServer").default;
		}
		case SocketEnum.WS: {
			return require("./impl/ws/WsSocketServer").default;
		}
		case SocketEnum.Grpc: {
			return require("./impl/grpc/GrpcServer").default;
		}
		default: {
			throw new Error(`Unable to support ${type}`);
		}
	}
}

export function SocketClientFactory(type: SocketEnum): SocketClientInterface<SocketClient> {
	switch (type) {
		case SocketEnum.SocketIO: {
			return require("./impl/io/IoSocketClient").default;
		}
		case SocketEnum.MQTT: {
			return require("./impl/mqtt/MqttSocketClient").default;
		}
		case SocketEnum.WS: {
			return require("./impl/ws/WsSocketClient").default;
		}
		case SocketEnum.Grpc: {
			return require("./impl/grpc/GrpcClient").default;
		}
		default: {
			throw new Error(`Unable to support ${type}`);
		}
	}
}
