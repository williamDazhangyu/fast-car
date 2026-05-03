import { FastCarApplication } from "@fastcar/core";
import { Application } from "@fastcar/core/annotation";
import EnableRedis from "../../src/annotation/EnableRedis";
import SimpleService from "./service/SimpleService";
import TestRedisTemplate from "./service/TestRedisTemplate";

@Application
@EnableRedis
class APP {
	app!: FastCarApplication;

	async startServer() {
		try {
			const simpleService = this.app.getComponentByTarget<SimpleService>(SimpleService);
			const redisTemplate = this.app.getComponentByTarget<TestRedisTemplate>(TestRedisTemplate);

			if (!simpleService || !redisTemplate) {
				throw new Error("redis test component not found");
			}

			await this.clean(redisTemplate);
			await this.testString(simpleService, redisTemplate);
			await this.testHash(redisTemplate);
			await this.testList(redisTemplate);
			await this.testSet(redisTemplate);
			await this.testZSet(redisTemplate);
			await this.testScanAndDelete(redisTemplate);
			await this.testLua(redisTemplate);
			await this.testPipeline(redisTemplate);
			await this.testPubSub(redisTemplate);
			await this.clean(redisTemplate);

			console.log("redis singleton test passed");
			await this.app.exitEvent("redis singleton test finished");
		} catch (err) {
			console.error(err);
			process.exitCode = 1;
			await this.app.exitEvent("redis singleton test failed");
		}
	}

	private async testString(simpleService: SimpleService, redisTemplate: TestRedisTemplate) {
		await simpleService.setHello();
		const hello = await simpleService.getHello();
		console.log("get hello:", hello);

		await redisTemplate.setEx("fastcar-redis:test:expire", "ok", 30);
		const expireValue = await redisTemplate.get("fastcar-redis:test:expire");
		const ttl = await redisTemplate.ttl("fastcar-redis:test:expire");
		console.log("get expire:", expireValue, ttl > 0);

		const nxFirst = await redisTemplate.setNx("fastcar-redis:test:nx", "first", 30);
		const nxSecond = await redisTemplate.setNx("fastcar-redis:test:nx", "second", 30);
		await redisTemplate.mSet({
			"fastcar-redis:test:m1": "v1",
			"fastcar-redis:test:m2": "v2",
		});
		const mValues = await redisTemplate.mGet(["fastcar-redis:test:m1", "fastcar-redis:test:m2"]);
		await redisTemplate.setJson("fastcar-redis:test:json", { name: "fastcar", count: 1 }, 30);
		const json = await redisTemplate.getJson<{ name: string; count: number }>("fastcar-redis:test:json");

		const counterKey = "fastcar-redis:test:counter";
		await redisTemplate.delKey(counterKey);
		const incrValue = await redisTemplate.incr(counterKey);
		const decrValue = await redisTemplate.decr(counterKey);
		const exists = await redisTemplate.exists("hello");
		console.log("string:", nxFirst, nxSecond, mValues, json, incrValue, decrValue, exists);

		if (hello !== "world" || expireValue !== "ok" || ttl <= 0 || !nxFirst || nxSecond || mValues.join(",") !== "v1,v2" || json?.name !== "fastcar" || incrValue !== 1 || decrValue !== 0 || !exists) {
			throw new Error("redis string test failed");
		}
	}

	private async testHash(redisTemplate: TestRedisTemplate) {
		const key = "fastcar-redis:test:hash";
		await redisTemplate.hSet(key, "name", "fastcar");
		await redisTemplate.hIncrBy(key, "count", 2);
		const name = await redisTemplate.hGet(key, "name");
		const count = await redisTemplate.hGet(key, "count");
		const exists = await redisTemplate.hExists(key, "name");
		const all = await redisTemplate.hGetAll(key);
		await redisTemplate.hDel(key, ["name"]);
		console.log("hash:", all);

		if (name !== "fastcar" || count !== "2" || !exists || all.name !== "fastcar" || all.count !== "2") {
			throw new Error("redis hash test failed");
		}
	}

	private async testList(redisTemplate: TestRedisTemplate) {
		const key = "fastcar-redis:test:list";
		await redisTemplate.rPush(key, ["a", "b"]);
		await redisTemplate.lPush(key, ["0"]);
		const values = await redisTemplate.lRange(key, 0, -1);
		const len = await redisTemplate.lLen(key);
		const left = await redisTemplate.lPop(key);
		const right = await redisTemplate.rPop(key);
		console.log("list:", values);

		if (values.join(",") !== "0,a,b" || len !== 3 || left !== "0" || right !== "b") {
			throw new Error("redis list test failed");
		}
	}

	private async testSet(redisTemplate: TestRedisTemplate) {
		const key = "fastcar-redis:test:set";
		await redisTemplate.sAdd(key, ["a", "b", "b"]);
		const members = await redisTemplate.sMembers(key);
		const isMember = await redisTemplate.sIsMember(key, "a");
		const size = await redisTemplate.sCard(key);
		await redisTemplate.sRem(key, ["a"]);
		console.log("set:", members.sort());

		if (members.sort().join(",") !== "a,b" || !isMember || size !== 2) {
			throw new Error("redis set test failed");
		}
	}

	private async testZSet(redisTemplate: TestRedisTemplate) {
		const key = "fastcar-redis:test:zset";
		await redisTemplate.zAdd(key, 2, "b");
		await redisTemplate.zAdd(key, 1, "a");
		const values = await redisTemplate.zRange(key, 0, -1);
		const revValues = await redisTemplate.zRevRange(key, 0, -1);
		const score = await redisTemplate.zScore(key, "b");
		const withScores = await redisTemplate.zRangeWithScores(key, 0, -1);
		await redisTemplate.zRem(key, ["a"]);
		console.log("zset:", values, withScores);

		if (values.join(",") !== "a,b" || revValues.join(",") !== "b,a" || score !== 2 || withScores[0].value !== "a" || withScores[0].score !== 1) {
			throw new Error("redis zset test failed");
		}
	}

	private async testScanAndDelete(redisTemplate: TestRedisTemplate) {
		await redisTemplate.set("fastcar-redis:test:scan:1", "1");
		await redisTemplate.set("fastcar-redis:test:scan:2", "2");
		const keys = await redisTemplate.scan("fastcar-redis:test:scan:*", 10);
		const deleted = await redisTemplate.delKeys("fastcar-redis:test:scan:*");
		console.log("scan:", keys.sort(), deleted);

		if (keys.length !== 2 || deleted !== 2) {
			throw new Error("redis scan test failed");
		}
	}

	private async testLua(redisTemplate: TestRedisTemplate) {
		const evalRes = await redisTemplate.eval("return ARGV[1]", [], ["lua-ok"]);
		const execLuaRes = await redisTemplate.execLua("return ARGV[1]", 0, "legacy-lua-ok");
		console.log("lua:", evalRes, execLuaRes);

		if (evalRes !== "lua-ok" || execLuaRes !== "legacy-lua-ok") {
			throw new Error("redis lua test failed");
		}
	}

	private async testPipeline(redisTemplate: TestRedisTemplate) {
		const pipelineRes = await redisTemplate.pipeline([
			["SET", "fastcar-redis:test:pipeline", "ok"],
			["GET", "fastcar-redis:test:pipeline"],
		]);
		const transactionRes = await redisTemplate.transaction([
			["SET", "fastcar-redis:test:transaction", "ok"],
			["GET", "fastcar-redis:test:transaction"],
		]);
		console.log("pipeline:", pipelineRes, transactionRes);

		if (pipelineRes[1] !== "ok" || transactionRes[1] !== "ok") {
			throw new Error("redis pipeline test failed");
		}
	}

	private async testPubSub(redisTemplate: TestRedisTemplate) {
		let received = "";
		const unsubscribe = await redisTemplate.subscribe("fastcar-redis:test:channel", (message) => {
			received = message;
		});

		await new Promise((resolve) => setTimeout(resolve, 50));
		const receivers = await redisTemplate.publish("fastcar-redis:test:channel", "hello-channel");
		await new Promise((resolve) => setTimeout(resolve, 50));
		await unsubscribe();
		console.log("pubsub:", receivers, received);

		if (receivers < 1 || received !== "hello-channel") {
			throw new Error("redis pubsub test failed");
		}
	}

	private async clean(redisTemplate: TestRedisTemplate) {
		await redisTemplate.delKeys("fastcar-redis:test:*");
	}
}

new APP();
