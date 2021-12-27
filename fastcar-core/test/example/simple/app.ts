import Application from "../../../src/annotation/Application";
import ENV from "../../../src/annotation/env/ENV";
import Log from "../../../src/annotation/Log";
import HelloController from "./controller/HelloController";
import FastCarApplication from "../../../src/FastCarApplication";

@Application
@ENV("TEST")
@Log() //启用默认日志注释 如果和方法重名则进行警告
class APP {
	app!: FastCarApplication;

	init() {
		console.log("123");
	}
}

let s = new APP();
//调用相关方法
// let helloController: HelloController = Reflect.get(s.app, "componentMap").get("HelloController");
// helloController.callHello();
// helloController.print();
// console.log("获取到的配置--", helloController.getConfig());
