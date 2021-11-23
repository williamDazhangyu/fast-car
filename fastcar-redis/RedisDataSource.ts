
import * as redis from "redis";

class RedisDataSource {

    private client: redis.RedisClient;

    constructor(config: redis.ClientOpts) {

        const client = redis.createClient(config);

        client.on("error", function (err) {

            console.error("redis error");
            console.error(err);
        });

        this.client = client;
    };

    getClient() {

        return this.client;
    }
};

export default RedisDataSource;