import { FastCarApplication } from "@fastcar/core";
import { Application, BaseFilePath, BasePath } from "@fastcar/core/annotation";
import SimpleService from "./service/SimpleService";
import TestDS from "./service/TestDS";
import TestTransactional from "./service/TestTransactional";
import EnablePgsql from "../../src/annotation/EnablePgsql";

@Application
@BasePath(__dirname) //直接运行ts文件时可不用
@BaseFilePath(__filename)
@EnablePgsql
class APP {
	app!: FastCarApplication;
}
const appInstance = new APP();

describe("sql测试", () => {
	it("crud测试", async () => {
		let service = appInstance.app.getComponentByTarget<SimpleService>(SimpleService);
		service?.saveOne().then((res) => {
			console.log(res);
		});

		let res2 = await service?.saveList();
		console.log(res2);

		service?.updateOne().then((res) => {
			console.log(res);
		});

		service?.exist().then((res) => {
			console.log(res);
		});

		service?.count().then((res) => {
			console.log(res);
		});

		service?.queryList().then((res) => {
			console.log(res);
		});

		service?.updateByPrimaryKey().then((res) => {
			console.log(res);
		});
	});

	it("事务执行测试", async () => {
		let service = appInstance.app.getComponentByTarget<TestTransactional>(TestTransactional);
		service?.exec();
		service
			?.work()
			.then((res) => {
				console.log(res);
			})
			.catch((e) => {
				console.error("service2");
				console.error(e);
			});
	});
	it("事务嵌套测试", async () => {
		let service = appInstance.app.getComponentByTarget<TestTransactional>(TestTransactional);
		service
			?.firstWork()
			.then((res) => {
				console.log(res);
			})
			.catch((e) => {
				console.error(e);
			});
	});
	it("多数据源测试", () => {
		let testTestDSService = appInstance.app.getComponentByTarget<TestDS>(TestDS);
		testTestDSService?.switchDS().then((res) => {
			console.log(res[0]?.caseName, res[1]?.caseName);
		});
	});

	it("数组测试", async () => {
		let service = appInstance.app.getComponentByTarget<SimpleService>(SimpleService);
		let res = await service?.queryIds();
		console.log(res?.length);
	});

	it("调用方法测试", async () => {
		let service = appInstance.app.getComponentByTarget<SimpleService>(SimpleService);
		let res = await service?.callFunction();
		console.log(res);
	});

	it("强制索引测试", async () => {
		let service = appInstance.app.getComponentByTarget<SimpleService>(SimpleService);
		let res = await service?.forceIndex();
		console.log(res);
	});

	it("函数测试", async () => {
		let service = appInstance.app.getComponentByTarget<SimpleService>(SimpleService);
		let res = await service?.testFormat();
		console.log(res);
	});

	it("连接测试", async () => {
		let service = appInstance.app.getComponentByTarget<SimpleService>(SimpleService);
		let res = await service?.testLeftJoin();
		console.log(res);
	});
});
