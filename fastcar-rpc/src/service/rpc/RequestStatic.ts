import { RetryConfig } from "../../types/RpcConfig";
import { SessionId } from "../../types/SocketConfig";
import RpcClient from "./RpcClient";
import RpcServer from "./RpcServer";

/***
 * @version 1.0 客户端发起请求
 * @params T为开始传参 K为返回结果
 */
export const ClientRequestStatic = async <T, K>(res: { client: RpcClient; url: string; data?: T; opts?: RetryConfig }): Promise<K> => {
	let result = await res.client.request(res.url, res.data, res.opts);
	return result.data as K;
};

/**
 *
 * @version 1.0  服务端向客户端发起请求
 * @params sessionId 为连接会话的具体id
 */
export const ServerRequestStatic = async <T, K>(res: { sessionId: SessionId; client: RpcServer; url: string; data?: T; opts?: RetryConfig }): Promise<K> => {
	let result = await res.client.request(res.sessionId, res.url, res.data, res.opts);
	return result.data as K;
};
