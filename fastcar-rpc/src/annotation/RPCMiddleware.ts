import { RpcMetaData } from "../constant/RpcMetaData";
import { Middleware } from "../types/RpcConfig";

//加载rpc组件
export default function RPCMiddleware(...args: Middleware[]) {
	return function (target: any) {
		let middlewareList: Middleware[] = Reflect.get(target.prototype, RpcMetaData.RPCMIDDLEWARE);
		if (!middlewareList) {
			middlewareList = args;
		} else {
			//由于注解方式是从下至上运行 和我们理解的书写习惯不一样，所以这边做了一个反序
			middlewareList = [...args, ...middlewareList];
		}
		Reflect.set(target.prototype, RpcMetaData.RPCMIDDLEWARE, middlewareList);
	};
}
