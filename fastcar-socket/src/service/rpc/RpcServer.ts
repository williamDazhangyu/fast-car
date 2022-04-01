import { BootPriority, FastCarApplication } from "fastcar-core";
import { ApplicationStart, ApplicationStop, Autowired } from "fastcar-core/annotation";
import { Middleware, RpcMessage, DesignMeta } from "../../type/RpcConfig";
import { ClientSession } from "../../type/SocketConfig";
import ComposeService from "../ComposeService";
import MsgCallbackService from "../MsgCallbackService";
import SocketManager from "../socket/SocketManager";

//rpc 管理服务 用于和客户端进行同步异步消息发送
@ApplicationStart(BootPriority.Lowest, "start")
@ApplicationStop(BootPriority.Base, "stop")
export default class RpcServer implements MsgCallbackService {
	@Autowired
	protected app!: FastCarApplication;

	protected socketManager!: SocketManager; //socket管理
	protected middleware: Middleware[]; //压缩后的组件方法
	protected composeMiddleware!: Middleware;

	//发送消息
	constructor() {
		this.socketManager = new SocketManager(this);
		this.middleware = [];
	}

	connect(session: ClientSession): void {
		//传递调用
		this.handleMsg(session, {
			url: "/connect", //路由
		});
	}

	disconnect(session: ClientSession, reason: string): void {
		this.handleMsg(session, {
			url: "/disconnect", //路由
			data: {
				reason,
			},
		});
	}

	async handleMsg(session: ClientSession, msg: RpcMessage): Promise<void> {
		//进行过滤调用
		let ctx = Object.assign(msg, session);
		//路由应该提前去绑定
		// this.composeMiddleware(ctx, () => {
		// 	//找路由---
		// 	//进行函数调用
		// 	//进行参数返回

		// });
	}

	getSocketManager() {
		return this.socketManager;
	}

	async start() {
		let middlerList: Middleware[] = this.app.getSetting(DesignMeta.RPCMIDDLEWARE);
		if (Array.isArray(middlerList) && middlerList.length > 0) {
			this.middleware = middlerList;
			this.composeMiddleware = ComposeService(this.middleware);
		}
	}

	async stop() {}
}
