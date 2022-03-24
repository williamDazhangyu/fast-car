import "reflect-metadata";
import Application from "../../../src/annotation/Application";
import ENV from "../../../src/annotation/env/ENV";
import HelloController from "./controller/HelloController";
import FastCarApplication from "../../../src/FastCarApplication";
import AliasController from "./controller/AliasController";
import BaseFilePath from "../../../src/annotation/env/BaseFilePath";
import BasePath from "../../../src/annotation/env/BasePath";
@Application
@ENV("TEST")
@BasePath(__dirname) //直接运行ts文件时可不用
@BaseFilePath(__filename)
class APP {
	app!: FastCarApplication;

	init() {
		console.log("123");
	}
}

let appInsatcne = new APP();
describe("程序应用测试", () => {
	it("获取配置", () => {
		//调用相关方法
		let helloController: HelloController = appInsatcne.app.getComponentByTarget(HelloController);
		helloController.callHello();
		helloController.print();
		console.log("获取到的配置--", helloController.getConfig());
	});

	it("测试别名", () => {
		let controller1: AliasController = appInsatcne.app.getComponentByName("controller1");
		console.log("controller1类型和AliasController相符", controller1 instanceof AliasController);
	});
});
