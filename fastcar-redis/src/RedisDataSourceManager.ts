import RedisDataSource from "./RedisDataSource";
import * as redis from "redis";
import { ApplicationStart, ApplicationStop, Autowired, Log } from "@fastcar/core/annotation";
import { BootPriority, FastCarApplication, Logger } from "@fastcar/core";

interface RedisConfig extends redis.ClientOpts {
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

	start(): void {
		let config: RedisConfig[] = this.app.getSetting("redis");
		if (config && Array.isArray(config)) {
			config.forEach((item) => {
				let source = item.source;
				Reflect.deleteProperty(item, "source");
				let client = new RedisDataSource(item);
				this.sourceMap.set(source, client);
			});
		} else {
			this.sysLogger.warn("Redis configuration not found");
		}
	}

	stop(): void {
		this.sourceMap.forEach((client) => {
			client.close();
		});

		this.sourceMap.clear();
	}

	getClient(source: string = "default"): redis.RedisClient | null {
		let client = this.sourceMap.get(source);
		if (!client) {
			return null;
		}
		return client.getClient();
	}
}

export default RedisDataSourceManager;
