import { ComponentInjection } from "@fastcar/core/annotation";

export default function EnableCache(target: any) {
	let fp = require.resolve("../CacheApplication");
	ComponentInjection(target, fp);
}
