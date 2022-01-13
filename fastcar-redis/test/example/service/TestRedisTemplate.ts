import { Repository, DS } from "fastcar-core/annotation";
import RedisTemplate from "../../../src/RedisTemplate";

//声明为redis操作模板

@Repository
@DS("default")
export default class TestRedisTemplate extends RedisTemplate {}
