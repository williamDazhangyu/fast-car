import { Service } from "@fastcar/core/annotation";
import { Autowired } from "@fastcar/core/annotation";
import TestRedisTemplate from "./TestRedisTemplate";

@Service
export default class SimpleService {
	@Autowired
	private redisTemplate!: TestRedisTemplate;

	async setHello() {
		await this.redisTemplate.set("hello", "world");
	}

	async getHello() {
		return await this.redisTemplate.get("hello");
	}
}
