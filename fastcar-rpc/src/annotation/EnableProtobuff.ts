import { ComponentInjection } from "@fastcar/core/annotation";

export default function EnableProtobuff(target: Object) {
	let fp = require.resolve("../service/ProtoBuffService");
	ComponentInjection(target, fp);
}
