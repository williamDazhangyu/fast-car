import { FastCarApplication } from "fastcar-core";
import { Application, BaseFilePath, BasePath } from "fastcar-core/annotation";
import EnableMysql from "../../src/annotation/EnableMysql";
import SimpleService from "./service/SimpleService";
import TestDS from "./service/TestDS";
import TestTransactional from "./service/TestTransactional";

@Application
@BasePath(__dirname) //直接运行ts文件时可不用
@BaseFilePath(__filename)
@EnableMysql //开启mysql数据库
class APP {
	app!: FastCarApplication;
}
const appInstance = new APP();

describe("mysql测试", () => {
	it("crud测试", async () => {
		let service: SimpleService = appInstance.app.getComponentByTarget(SimpleService);
		// 详情看更多的内部测试;
		service.saveOne().then((res) => {
			console.log(res);
		});

		service.selectOne().then((res) => {
			console.log(res);
		});
	});

	it("事务执行测试", async () => {
		let service: TestTransactional = appInstance.app.getComponentByTarget(TestTransactional);
		service.exec();
		service
			.work()
			.then((res) => {
				console.log(res);
			})
			.catch((e) => {
				console.error("service2");
				console.error(e);
			});
	});
	it("事务嵌套测试", async () => {
		let service: TestTransactional = appInstance.app.getComponentByTarget(TestTransactional);
		service
			.firstWork()
			.then((res) => {
				console.log(res);
			})
			.catch((e) => {
				console.error(e);
			});
	});
	it("多数据源测试", () => {
		let testTestDSService: TestDS = appInstance.app.getComponentByTarget(TestDS);
		testTestDSService.switchDS().then((res) => {
			console.log(res[0]?.caseName, res[1]?.caseName);
		});
	});

	it("数组测试", async () => {
		let service: SimpleService = appInstance.app.getComponentByTarget(SimpleService);
		let res = await service.queryIds();
		console.log(res.length);
	});

	it("调用方法测试", async () => {
		let service: SimpleService = appInstance.app.getComponentByTarget(SimpleService);
		let res = await service.callFunction();
		console.log(res);
	});

	it("强制索引测试", async () => {
		let service: SimpleService = appInstance.app.getComponentByTarget(SimpleService);
		let res = await service.forceIndex();
		console.log(res);
	});

	it("函数测试", async () => {
		let service: SimpleService = appInstance.app.getComponentByTarget(SimpleService);
		let res = await service.testFormat();
		console.log(res);
	});
});
