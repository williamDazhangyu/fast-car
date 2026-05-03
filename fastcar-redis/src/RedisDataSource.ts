import { createClient, RedisClientOptions, RedisClientType } from "redis";

export interface RedisDataSourceConfig extends RedisClientOptions {
	host?: string;
	port?: number;
	path?: string;
	tls?: boolean;
}

class RedisDataSource {
	private client: RedisClientType;

	constructor(config: RedisDataSourceConfig) {
		const client = createClient(this.normalizeConfig(config)) as RedisClientType;

		client.on("error", function(err) {
			console.error("redis error");
			console.error(err);
		});

		this.client = client;
	}

	async connect() {
		if (!this.client.isOpen) {
			await this.client.connect();
		}

		await this.checkClient();
	}

	async checkClient() {
		await this.client.ping();
	}

	getClient() {
		return this.client;
	}

	async close() {
		if (this.client.isOpen) {
			await this.client.close();
		}
	}

	private normalizeConfig(config: RedisDataSourceConfig): RedisClientOptions {
		const { host, port, path, tls, socket, ...clientConfig } = config;
		const socketConfig = {
			...socket,
			...(host ? { host } : {}),
			...(port ? { port } : {}),
			...(path ? { path } : {}),
			...(tls === undefined ? {} : { tls }),
		};

		if (Object.keys(socketConfig).length === 0) {
			return clientConfig;
		}

		return {
			...clientConfig,
			socket: socketConfig as RedisClientOptions["socket"],
		};
	}
}

export default RedisDataSource;
