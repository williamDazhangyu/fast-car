import { DataMap, Logger } from "@fastcar/core";
import { Controller, Log } from "@fastcar/core/annotation";
import RPC from "../../../../src/annotation/RPC";
import RPCMethod from "../../../../src/annotation/RPCMethod";
import { RpcContext } from "../../../../src/types/RpcConfig";

@Controller
@RPC("/test")
export default class BatchTestController {
	private totalTask = 0;

	@Log()
	private logger!: Logger;

	private ids = new DataMap<number, string[]>();
	@RPCMethod()
	async batch({ mid }: { mid: number }, ctx: RpcContext) {
		this.totalTask++;

		this.logger.info(`消息mid----${mid}`);
		let msgIds = this.ids.get(mid);
		if (!msgIds) {
			msgIds = [];
			this.ids.set(mid, msgIds);
		}

		msgIds.push(`${ctx.sessionId}-${ctx.id}`);
		if (msgIds.length > 1) {
			this.logger.info(JSON.stringify(`重复的id:${mid} 会话id列表:${msgIds.join(",")}`));
		}
		return new Promise((resolve) => {
			setTimeout(() => {
				this.logger.info(`当前接收的任务数量${this.totalTask}`);
				resolve({
					mid,
				});
			}, Math.floor(2000 * Math.random()));
		});
	}
}
