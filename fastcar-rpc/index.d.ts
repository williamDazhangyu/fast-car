import {
	Middleware,
	RetryConfig,
	RpcClientConfig,
	RpcClientMsgBox,
	RpcConfig,
	RpcContext,
	RpcFailMsgQueue,
	RpcMessage,
	RpcNotiyMessage,
	RpcResponseType,
	RpcServerMsgBox,
	RpcServerRequestType,
	RpcUrl,
} from "./src/types/RpcConfig";
import { SocketClientConfig, SessionId, ClientSession, SocketServerConfig } from "./src/types/SocketConfig";
import MsgClientHookService from "./src/service/MsgClientHookService";
import { SocketClient } from "./src/service/socket/SocketClient";
import { Logger } from "@fastcar/core";
import SocketManager from "./src/service/socket/SocketManager";
import { SocketMsgStatus } from "./src/constant/SocketMsgStatus";
import MsgCallbackService from "./src/service/MsgCallbackService";

export * from "./src/types/RpcConfig";
export * from "./src/types/SocketConfig";
export * from "./src/types/SocketEvents";
export * from "./src/constant/RpcMetaData";
export * from "./src/constant/RpcUrlData";
export * from "./src/constant/SocketEnum";
export * from "./src/constant/SocketSymbol";
export * from "./src/constant/SocketCodingDefault";
export * from "./src/types/CodeProtocolEnum";
export * from "./src/types/PBConfig";
export interface RpcAuthService {
	auth(username: string, password: string, config: SocketServerConfig, session: ClientSession, request?: any): Promise<boolean>;

	auth(username: string, password: string, config: SocketServerConfig, request?: any): Promise<boolean>;
}

export interface RPCErrorService {
	response(): Middleware;
}

export interface RpcAsyncService {
	handleMsg(url: string, data: Object): Promise<Object | void>;
}

export class RpcClient implements MsgClientHookService {
	protected client: SocketClient;
	protected msgQueue: Map<number, RpcClientMsgBox>; //序列号 消息队列
	protected serialId: number; //序列号
	protected config: RpcClientConfig; //消息配置
	protected checkStatus: boolean;
	protected rpcService: RpcAsyncService;
	protected checkConnectTimer: number;
	protected rpcLogger: Logger;

	constructor(config: SocketClientConfig, rpcService: RpcAsyncService, retry?: RetryConfig);

	getLogger(): Logger;

	addSerialId(): number;

	start(): Promise<void>;

	stop(reason: string): void;

	close(reasion?: string): void;

	getClient(): SocketClient;

	//是否已经连接
	isConnect(): boolean;

	isForceConnect(): boolean;

	getSessionId(): SessionId;

	handleMsg(msg: RpcMessage): Promise<void>;
	//发送消息
	request(url: string, data?: Object, opts?: RetryConfig): Promise<RpcResponseType>;
}

export class RpcServer implements MsgCallbackService {
	private rpcLogger: Logger;
	protected socketManager: SocketManager; //socket管理
	protected middleware: Middleware[]; //压缩后的组件方法
	protected composeMiddleware: (context: RpcContext) => void;
	protected rcpRouterMap: Map<RpcUrl, Function>;
	protected msgQueue: Map<number, RpcServerMsgBox>; //序列号 消息队列
	protected serialId: number;
	protected rpcConfig: RpcConfig;
	protected failMsgQueue: RpcFailMsgQueue[];
	protected checkStatus: boolean;

	//序列号递增
	protected addSerialId(): number;

	//封装请求 做出回应
	response(): Middleware;

	/***
	 * @version 1.0 加载路由
	 *
	 */
	protected loadRoute(): Middleware | null;

	connect(session: ClientSession): void;

	auth(username: string, password: string, session: ClientSession): Promise<boolean>;

	disconnect(session: ClientSession, reason: string): void;

	handleMsg(session: ClientSession, msg: RpcMessage): void;

	public getSocketManager(): SocketManager;

	//给单个会话发送消息
	protected sendMsgBySessionId(m: RpcServerRequestType): Promise<void>;
	//重试消息
	protected retrySendMsg(m: RpcFailMsgQueue): Promise<SocketMsgStatus>;

	protected pushFailMsg(m: RpcFailMsgQueue): void;

	/***
	 * @version 1.0 异步通知消息 不保证客户端一定能收到消息
	 *
	 */
	protected notifyMessage(msg: RpcNotiyMessage): void;

	/***
	 * @version 1.0 向客户端发起请求
	 * @params  sessionId 会话id
	 * @params  data 发起的数据
	 * @params timeout 超时后返回 默认3s
	 *
	 */
	public request(sessionId: SessionId, url: string, data?: Object, opts?: RetryConfig): Promise<RpcResponseType>;

	//强制下线
	kickSessionId(sessionId: SessionId, reason: string): void;
	//失败的消息处理
	handleFailMsg(msg: RpcMessage, res: RpcResponseType): void;

	use(m: Middleware): void;

	private getResponseMiddleware(): Middleware;

	private setMiddleware(): void;
}

//封装客户端向服务端发起请求
export function ClientRequestStatic<T, K>(res: { client: RpcClient; url: string; data?: T; opts?: RetryConfig }): Promise<K>;

//封装服务端向客户端发起请求
export function ServerRequestStatic<T, K>(res: { sessionId: SessionId; client: RpcServer; url: string; data?: T; opts?: RetryConfig }): Promise<K>;

//导出pb工具类
export * as ProtoBuffService from "./src/service/ProtoBuffService";
