type Ret = (target: any) => void;

type MRet = (target: any, methodName: string, descriptor: PropertyDescriptor) => void;

type PPRet = (target: any, method: string, index: number) => void;

import { Middleware } from "./src/types/RpcConfig";

export function EnableRPC(target: any): void; //开启rpc功能

export function RPC(url?: string): Ret; //开启顶部路由扫描

export function RPCMethod(url?: string): MRet; //开启路由方法绑定

export function RPCMiddleware(...args: Middleware[]): Ret; //中间件绑定

export function RPCAuth(target: any): void; //声明rpc验证服务

export function RPCError(target: any): void; //声明错误捕捉服务

export function EnableProtobuff(target: Object): void; //开启pb
