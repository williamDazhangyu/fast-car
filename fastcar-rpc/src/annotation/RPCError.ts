import { BeanName, Component } from "fastcar-core/annotation";
import { RpcMetaData } from "../constant/RpcMetaData";
import { TypeUtil } from "fastcar-core/utils";

//声明这是一个rpc验证服务
export default function RPCError(target: any) {
	if (!Reflect.has(target.prototype, "response")) {
		throw new Error("rpc response method not implemented");
	}

	let response = Reflect.get(target.prototype, "response");
	if (!TypeUtil.isFunction(response)) {
		throw new Error("rpc response property is not a method");
	}

	//声明为组件
	Component(target);
	//声明别名确保可以找到
	BeanName(RpcMetaData.RPCErrorService);
}
