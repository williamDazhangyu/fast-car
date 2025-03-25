import "reflect-metadata";
import { SocketEnum } from "../../../src";
import RpcClient from "../../../src/service/rpc/RpcClient";
import RpcAsyncService from "../../../src/service/RpcAsyncService";

class NotifyHandle implements RpcAsyncService {
	async handleMsg(url: string, data: Object): Promise<void | Object> {
		console.log("收到服务端消息", url, data);
		return {
			url,
			data: "来自客户端的消息---",
		};
	}
}

let instances = 30;
let msgId = 0;
let runNum = 100;

let total = instances * runNum;

for (let i = 0; i < instances; i++) {
	let client = new RpcClient(
		{
			url: "ws://localhost:1238",
			type: SocketEnum.WS,
			connectionLimit: 1,
		},
		new NotifyHandle()
	);
	client.start().then(async () => {
		for (let run = 0; run < runNum; run++) {
			let res = await client.request("/test/batch", {
				mid: ++msgId,
			});
			--total;
			console.log(`接收消息`, JSON.stringify(res));
		}

		console.log(`当前剩余的任务数量${total}`);
	});
}
