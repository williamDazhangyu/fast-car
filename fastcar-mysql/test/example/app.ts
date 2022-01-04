import { FastCarApplication } from "fastcar-core";
import { Application, ComponentScan, Log } from "fastcar-core/annotation";
import EnableMysql from "../../src/annotation/EnableMysql";
import SimpleService from "./service/SimpleService";
import TestTransactional from "./service/TestTransactional";

@Application
@EnableMysql //开启mysql数据库
@Log()
class APP {
	app!: FastCarApplication;
}

const appInstance = new APP();

console.log("crud测试");
let service: SimpleService = appInstance.app.getComponentByName("SimpleService");
service.saveOne().then((res) => {
	console.log(res);
});

let service2: TestTransactional = appInstance.app.getComponentByName("TestTransactional");
service2.exec();
console.log("事务执行测试");
service2
	.work()
	.then((res) => {
		console.log(res);
	})
	.catch((e) => {
		console.error("service2");
		console.error(e);
	});

console.log("事务嵌套测试");

service2
	.firstWork()
	.then((res) => {
		console.log(res);
	})
	.catch((e) => {
		console.error(e);
	});
