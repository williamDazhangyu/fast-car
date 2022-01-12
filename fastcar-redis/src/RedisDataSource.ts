import * as redis from "redis";

class RedisDataSource {
	private client: redis.RedisClient;
	private config: redis.ClientOpts;

	constructor(config: redis.ClientOpts) {
		const client = redis.createClient(config);

		client.on("error", function(err) {
			console.error("redis error");
			console.error(err);
		});

		this.client = client;
		this.config = config;
	}

	checkClient() {
		this.client.ping();
	}

	getClient() {
		return this.client;
	}

	close() {
		this.client.end();
	}
}

export default RedisDataSource;
