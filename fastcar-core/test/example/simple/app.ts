import "reflect-metadata";
import Application from "../../../src/annotation/Application";
import ENV from "../../../src/annotation/env/ENV";
import Log from "../../../src/annotation/Log";
import HelloController from "./controller/HelloController";
import FastCarApplication from "../../../src/FastCarApplication";
import AliasController from "./controller/AliasController";

@Application
@ENV("TEST")
@Log() //启用默认日志注释 如果和方法重名则进行警告
class APP {
	app!: FastCarApplication;

	init() {
		console.log("123");
	}
}

let appInsatcne = new APP();
//调用相关方法
// let helloController: HelloController = appInsatcne.app.getComponentByTarget(HelloController);
// helloController.callHello();
// helloController.print();
// console.log("获取到的配置--", helloController.getConfig());

let controller1: AliasController = appInsatcne.app.getComponentByName("controller1");
console.log("controller1类型和AliasController相符", controller1 instanceof AliasController);
