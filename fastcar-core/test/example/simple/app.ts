import "reflect-metadata";
import Application from "../../../src/annotation/Application";
import ENV from "../../../src/annotation/env/ENV";
import HelloController from "./controller/HelloController";
import FastCarApplication from "../../../src/FastCarApplication";
import AliasController from "./controller/AliasController";
import BaseFilePath from "../../../src/annotation/env/BaseFilePath";
import BasePath from "../../../src/annotation/env/BasePath";
import ApplicationHook from "../../../src/interface/ApplicationHook";
import Log from "../../../src/annotation/stereotype/Log";
import Logger from "../../../src/interface/Logger";
import ApplicationSetting from "../../../src/annotation/env/ApplicationSetting";
import { ComponentScanExclusion } from "../../../src/annotation";
import * as path from "path";

@ComponentScanExclusion(path.join(__dirname, "app-test.ts"))
@Application
@ENV("test") //设置环境变量
@BasePath(__dirname) //直接运行ts文件时可不用
@BaseFilePath(__filename)
@ApplicationSetting({
	customHello: "customHello",
	appid: "fastcar-server",
})
class APP implements ApplicationHook {
	app!: FastCarApplication;

	@Log("app")
	logger!: Logger;

	beforeStartServer(): void {
		this.logger.debug("beforeStartServer-----");
	}

	startServer(): void {
		this.logger.debug("startServer------");
	}

	beforeStopServer(): void {
		this.logger.debug("beforeStopServer-----");
	}

	stopServer(): void {
		this.logger.debug("stopServer-----");
	}
}

let appInsatcne = new APP();

//引用记得放在app扫描后进行
import EnvConfig from "./config/EnvConfig";
import CallService from "./service/CallService";
import NotFoundController from "./controller/NotFoundController";
import HotConfig from "./config/HotConfig";
import HelloConfig from "./config/HelloConfig";

describe("程序应用测试", () => {
	it("获取配置", () => {
		//调用相关方法
		let helloController = appInsatcne.app.getComponentByTarget<HelloController>(HelloController);
		helloController?.callHello();
		helloController?.print();
		console.log("获取到的配置--", helloController?.getConfig());
	});
	it("测试别名", () => {
		let controller1 = appInsatcne.app.getComponentByName("controller1") as AliasController;
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
		let evnConfig = appInsatcne.app.getComponentByTarget<EnvConfig>(EnvConfig);
		console.log(evnConfig?.text);
	});
	it("测试调用时加载时机才会注入方法", () => {
		let callServerice = new CallService();
		callServerice.sayHello();
	});
	it("程序内配置", () => {
		console.log("配置", appInsatcne.app.getSetting("customHello"));
	});
	it("查找一个不存在的注入", () => {
		let notFound = appInsatcne.app.getComponentByTarget<NotFoundController>(NotFoundController);
		try {
			notFound?.getNotFound();
		} catch (e) {
			appInsatcne.app.getLogger().error(e);
		}
		try {
			notFound?.getAutoNotFound();
		} catch (e) {
			appInsatcne.app.getLogger().error(e);
		}
	});
	it("热更新配置解析", () => {
		setInterval(() => {
			let hotConfig = appInsatcne.app.getComponentByTarget<HotConfig>(HotConfig);
			let helloConfig = appInsatcne.app.getComponentByTarget<HelloConfig>(HelloConfig);
			console.log("热更新配置", hotConfig?.hello);
			console.log("不变的配置", helloConfig?.hello);
		}, 1000);
	});
});
