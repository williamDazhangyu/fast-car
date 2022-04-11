import { ComponentInjection } from "fastcar-core/annotation";

export default function EnableServer(target: any) {
	//手动注入实例
	let fp = require.resolve("./ServerApplication");
	ComponentInjection(target, fp);
}
