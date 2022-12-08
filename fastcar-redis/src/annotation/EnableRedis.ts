import { ComponentInjection } from "@fastcar/core/annotation";

//开启redis插件
export default function EnableRedis(target: any) {
	let fp = require.resolve("../RedisDataSourceManager");
	ComponentInjection(target, fp);
}
