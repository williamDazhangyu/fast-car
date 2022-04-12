import { SocketEnum } from "../../constant/SocketEnum";
import { SocketServerConfig } from "../../types/SocketConfig";
import MsgHookService from "../MsgHookService";
import SocketServer from "./SocketServer";

interface SocketServerInterface<T> {
	new (config: SocketServerConfig, manager: MsgHookService): T;
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
	}
}

export function SocketClientFactory(type: SocketEnum) {
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
	}
}
