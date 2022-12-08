import { ComponentInjection } from "@fastcar/core/annotation";
import { EnableServer } from "@fastcar/server";

//开启rpc
export default function EnableRPC(target: any) {
	let fp = require.resolve("../service/rpc/RpcServer");
	ComponentInjection(target, fp);
	EnableServer(target); //默认依赖注入server
}
