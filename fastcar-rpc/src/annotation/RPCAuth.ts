import { BeanName, Component } from "@fastcar/core/annotation";
import { RpcMetaData } from "../constant/RpcMetaData";
import { TypeUtil } from "@fastcar/core/utils";

//声明这是一个rpc验证的服务
export default function RPCAuth(target: any) {
	if (!Reflect.has(target.prototype, "auth")) {
		throw new Error("rpc auth method not implemented");
	}

	let auth = Reflect.get(target.prototype, "auth");
	if (!TypeUtil.isFunction(auth)) {
		throw new Error("rpc auth property is not a method");
	}

	//声明为组件
	Component(target);
	//声明别名确保可以找到
	BeanName(RpcMetaData.RPCAuthService);
}
