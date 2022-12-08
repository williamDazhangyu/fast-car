import { FastCarApplication } from "@fastcar/core";
import { Application } from "@fastcar/core/annotation";
import EnableRedis from "../../src/annotation/EnableRedis";
import SimpleService from "./service/SimpleService";

@Application
@EnableRedis
class APP {
	app!: FastCarApplication;
}

const appInstance = new APP();

console.log("redis 测试");
let simpleService: SimpleService = appInstance.app.getComponentByTarget(SimpleService);

simpleService.setHello().then(async () => {
	let res = await simpleService.getHello();
	console.log(res);
});
