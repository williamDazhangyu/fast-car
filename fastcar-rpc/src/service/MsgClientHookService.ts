import { Logger } from "fastcar-core";

//消息钩子
export default interface MsgClientHookService {
	handleMsg(msg: Object): void;

	getLogger(): Logger;
}
