import { ApplicationStart, Autowired } from "fastcar-core/annotation";
import { BootPriority, FastCarApplication } from "fastcar-core";
import ServerApplication from "../../../../src/ServerApplication";
import { ServerConfig } from "../../../../src/type/ServerConfig";
import { Protocol } from "../../../../src/type/Protocol";

@ApplicationStart(BootPriority.Lowest)
export default class ServerService {
	@Autowired
	protected serverApplication!: ServerApplication;

	@Autowired
	protected app!: FastCarApplication;

	run() {
		let list: ServerConfig[] = this.app.getSetting("server");

		//进行创建
		list.forEach((item) => {
			this.serverApplication.createServer(item, (req: any, res: any) => {
				try {
					if (item.protocol == Protocol.http || item.protocol == Protocol.https || item.protocol == Protocol.http2) {
						res.writeHead(200);
						res.end("hello world\n");
					} else {
						req.end("hello world\n");
					}
				} catch (e) {
					console.error(e);
				}
			});
		});
	}
}
