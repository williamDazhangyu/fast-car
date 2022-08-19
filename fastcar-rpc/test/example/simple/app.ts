import "reflect-metadata";
import { FastCarApplication } from "fastcar-core";
import { Application, ApplicationSetting, BaseFilePath, BasePath, ComponentScanExclusion } from "fastcar-core/annotation";
import EnableRPC from "../../../src/annotation/EnableRpc";
import * as path from "path";
import RpcServerList from "./RpcServerList";

@Application
@BasePath(__dirname)
@BaseFilePath(__filename)
@EnableRPC
@ComponentScanExclusion(path.join(__dirname, "client.ts"))
@ApplicationSetting(RpcServerList)
class APP {
	app!: FastCarApplication;
}
const appInstance = new APP();
