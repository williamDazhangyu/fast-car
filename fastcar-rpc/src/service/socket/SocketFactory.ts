import { SocketEnum } from "../../constant/SocketEnum";
import IoSocketClient from "./impl/io/IoSocketClient";
import IoSocketServer from "./impl/io/IoSocketServer";
import MqttSocketClient from "./impl/mqtt/MqttSocketClient";
import MqttSocketServer from "./impl/mqtt/MqttSocketServer";

export function SocketServerFactory(type: SocketEnum) {
	switch (type) {
		case SocketEnum.SocketIO: {
			return IoSocketServer;
		}
		case SocketEnum.MQTT: {
			return MqttSocketServer;
		}
	}

	return null;
}

export function SocketClientFactory(type: SocketEnum) {
	switch (type) {
		case SocketEnum.SocketIO: {
			return IoSocketClient;
		}
		case SocketEnum.MQTT: {
			return MqttSocketClient;
		}
	}

	return null;
}
