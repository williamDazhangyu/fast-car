import { ComponentInjection } from "fastcar-core/annotation";
import { EnableServer } from "fastcar-server";

//开启koa应用
export default function EnableKoa(target: any) {
	let fp = require.resolve("../KoaApplication");
	ComponentInjection(target, fp);
	EnableServer(target);
}
