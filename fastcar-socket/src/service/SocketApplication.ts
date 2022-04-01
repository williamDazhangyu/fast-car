import SocketServer from "./socket/SocketServer";
import { ApplicationStart, ApplicationStop, Autowired, Log } from "fastcar-core/annotation";
import { BootPriority, FastCarApplication, Logger } from "fastcar-core";
import { ClientSession, ServerId, SessionId, SocketServerConfig } from "../type/SocketConfig";
import { ValidationUtil } from "fastcar-core/utils";
import { SocketEnum } from "../constant/SocketEnum";
import MsgHookService from "./MsgHookService";
import { SocketServerFactory } from "./socket/SocketFactory";
import SocketManager from "./socket/SocketManager";

@ApplicationStart(BootPriority.Lowest, "start")
@ApplicationStop(BootPriority.Base, "stop")
export default class SocketApplication {
	@Autowired
	protected app!: FastCarApplication;

	@Log("socket")
	protected socketLogger!: Logger;

	private socketManager: SocketManager;

	constructor() {
		this.socketManager = new SocketManager(this);
	}

	async start(): Promise<void> {
		let socketConfig: SocketServerConfig[] = this.app.getSetting("socket");
		await this.socketManager.start(socketConfig);
	}

	async stop(): Promise<void> {
		await this.socketManager.stop();
	}
}
