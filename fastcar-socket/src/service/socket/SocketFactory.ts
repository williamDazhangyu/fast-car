import { SocketEnum } from "../../constant/SocketEnum";
import IoSocketClient from "../impl/io/IoSocketClient";
import IoSocketServer from "../impl/io/IoSocketServer";

export function SocketServerFactory(type: SocketEnum) {
	switch (type) {
		case SocketEnum.SocketIO: {
			return IoSocketServer;
		}
	}

	return null;
}

export function SocketClientFactory(type: SocketEnum) {
	switch (type) {
		case SocketEnum.SocketIO: {
			return IoSocketClient;
		}
	}

	return null;
}
