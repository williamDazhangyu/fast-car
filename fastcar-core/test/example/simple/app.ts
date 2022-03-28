import "reflect-metadata";
import Application from "../../../src/annotation/Application";
import ENV from "../../../src/annotation/env/ENV";
import HelloController from "./controller/HelloController";
import FastCarApplication from "../../../src/FastCarApplication";
import AliasController from "./controller/AliasController";
import BaseFilePath from "../../../src/annotation/env/BaseFilePath";
import BasePath from "../../../src/annotation/env/BasePath";
@Application
@ENV("test") //设置环境变量
@BasePath(__dirname) //直接运行ts文件时可不用
@BaseFilePath(__filename)
class APP {
	app!: FastCarApplication;

	init() {
		console.log("123");
	}
}

let appInsatcne = new APP();

//引用记得放在app扫描后进行
import EnvConfig from "./config/EnvConfig";

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
	it("获取完善的加载信息", () => {
		let appInfo = appInsatcne.app.getComponentDetailByName(FastCarApplication.name);
		console.log("app 加载信息", appInfo);
		let hellControllerInfo = appInsatcne.app.getComponentDetailByTarget(HelloController);
		console.log("hellControllerInfo 加载信息", hellControllerInfo);
	});
	it("调用进程使用相关信息", () => {
		setTimeout(() => {
			console.log(appInsatcne.app.getMemoryUsage());
		}, 2000);
	});
	it("根据环境动态设置变量", () => {
		let evnConfig: EnvConfig = appInsatcne.app.getComponentByTarget(EnvConfig);
		console.log(evnConfig.text);
	});
});
