import { SocketServerConfig, SocketSession } from "../../../type/SocketConfig";
import SocketApplication from "../../SocketApplication";
import SocketServer from "../../SocketServer";

export default class WsSocketServer extends SocketServer {
	constructor(config: SocketServerConfig, manager: SocketApplication) {
		super(config, manager);
	}

	listen(): Promise<void> {
		throw new Error("Method not implemented.");
	}
	close(): Promise<void> {
		throw new Error("Method not implemented.");
	}
	sendMsg(sessionId: string, msg: Object): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	receiveMsg(sessionId: string, msg: string | Buffer): void {
		throw new Error("Method not implemented.");
	}
	joinChannel(sessionId: string, channel: string): void {
		throw new Error("Method not implemented.");
	}
	leaveChannel(sessionId: string, channel: string): void {
		throw new Error("Method not implemented.");
	}
	sendMsgByChannel(channel: string): void {
		throw new Error("Method not implemented.");
	}
	offline(session: SocketSession): void {
		throw new Error("Method not implemented.");
	}
}
