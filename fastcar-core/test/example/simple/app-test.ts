import "reflect-metadata";
import Application from "../../../src/annotation/Application";
import ENV from "../../../src/annotation/env/ENV";
import FastCarApplication from "../../../src/FastCarApplication";
import BaseFilePath from "../../../src/annotation/env/BaseFilePath";
import BasePath from "../../../src/annotation/env/BasePath";
import ApplicationHook from "../../../src/interface/ApplicationHook";
import Log from "../../../src/annotation/stereotype/Log";
import Logger from "../../../src/interface/Logger";
import ApplicationSetting from "../../../src/annotation/env/ApplicationSetting";
import { ComponentScanExclusion } from "../../../src/annotation";
import BaseName from "../../../src/annotation/env/BaseName";
import * as path from "path";

@Application
@ENV("test") //设置环境变量
@BasePath(__dirname) //直接运行ts文件时可不用
@BaseFilePath(__filename)
@ApplicationSetting({
	appid: "other-server",
})
@BaseName("other")
@ComponentScanExclusion(path.join(__dirname, "app.ts"))
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
console.log("打印文件读取名称", appInsatcne.app.getBaseName());
console.log("打印文件内容", appInsatcne.app.getSetting("name"));
