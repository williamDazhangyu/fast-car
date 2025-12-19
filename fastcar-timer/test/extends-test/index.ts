import "reflect-metadata";
import { destoryHeartbet, destoryHeartbetAll, getHeartbeat } from "../../src/Scheduling2";
import ChildA from "./ChildA";
import ChildB from "./ChildB";

let a = new ChildA();

let b = new ChildB();

setTimeout(() => {
	let aa = getHeartbeat(a, "loop");
	if (aa) {
		console.log(`停止 A 的定时任务`);
		aa.pause();

		setTimeout(() => {
			console.log(`重新开启 A 的定时任务`);
			aa.start(a.loop, a);
		}, 1000);
	}
}, 2000);
