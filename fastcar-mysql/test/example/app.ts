import { FastCarApplication } from "fastcar-core";
import { Application, ComponentScan, Log } from "fastcar-core/annotation";
import EnableMysql from "../../src/annotation/EnableMysql";
import SimpleService from "./service/SimpleService";
import TestDS from "./service/TestDS";
import TestTransactional from "./service/TestTransactional";

@Application
@EnableMysql //开启mysql数据库
class APP {
	app!: FastCarApplication;
}

const appInstance = new APP();

console.log("crud测试");
let service: SimpleService = appInstance.app.getComponentByTarget(SimpleService);
// 详情看更多的内部测试;
// service.saveOne().then((res) => {
// 	console.log(res);
// });

// service.selectOne().then((res) => {
// 	console.log(res);
// });

let service2: TestTransactional = appInstance.app.getComponentByTarget(TestTransactional);
// console.log("纯sql测试");
// service2.exec();

// console.log("事务执行测试");
// service2
// 	.work()
// 	.then((res) => {
// 		console.log(res);
// 	})
// 	.catch((e) => {
// 		console.error("service2");
// 		console.error(e);
// 	});

console.log("事务嵌套测试");
service2
	.firstWork()
	.then(res => {
		console.log(res);
	})
	.catch(e => {
		console.error(e);
	});

// console.log("多数据源测试");
// let testTestDSService: TestDS = appInstance.app.getComponentByTarget(TestDS);
// testTestDSService.switchDS().then((res) => {
// 	console.log(res[0]?.caseName, res[1]?.caseName);
// });
