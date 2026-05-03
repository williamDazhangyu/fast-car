import RedisDataSource, { RedisDataSourceConfig } from "./RedisDataSource";
import { RedisClientType } from "redis";
import { ApplicationStart, ApplicationStop, Autowired, Log } from "@fastcar/core/annotation";
import { BootPriority, FastCarApplication, Logger } from "@fastcar/core";

interface RedisConfig extends RedisDataSourceConfig {
	source: string;
}

/***
 * @version 1.0 redis数据源管理
 */
@ApplicationStart(BootPriority.Base, "start")
@ApplicationStop(BootPriority.Lowest, "stop")
class RedisDataSourceManager {
	//数据源
	protected sourceMap: Map<string, RedisDataSource>;

	@Autowired
	protected app!: FastCarApplication;

	@Log("redis")
	protected sysLogger!: Logger;

	constructor() {
		this.sourceMap = new Map();
	}

	async start(): Promise<void> {
		if (this.sourceMap.size > 0) {
			return;
		}

		let config: RedisConfig[] = this.app.getSetting("redis");
		if (config && Array.isArray(config)) {
			await Promise.all(config.map(async (item) => {
				let source = item.source;
				Reflect.deleteProperty(item, "source");
				let client = new RedisDataSource(item);
				await client.connect();
				this.sourceMap.set(source, client);
			}));
		} else {
			this.sysLogger.warn("Redis configuration not found");
		}
	}

	async stop(): Promise<void> {
		await Promise.all(Array.from(this.sourceMap.values()).map((client) => client.close()));

		this.sourceMap.clear();
	}

	getClient(source: string = "default"): RedisClientType | null {
		let client = this.sourceMap.get(source);
		if (!client) {
			return null;
		}
		return client.getClient();
	}
}

export default RedisDataSourceManager;
