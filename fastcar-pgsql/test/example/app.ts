import { expect } from "chai";
import { FastCarApplication } from "@fastcar/core";
import { Application, BaseFilePath, BasePath } from "@fastcar/core/annotation";
import EnablePgsql from "../../src/annotation/EnablePgsql";
import Test from "./model/Test";
import TestMapper from "./mapper/TestMapper";
import SimpleService from "./service/SimpleService";
import TestDS from "./service/TestDS";
import TestTransactional from "./service/TestTransactional";

@Application
@BasePath(__dirname)
@BaseFilePath(__filename)
@EnablePgsql
class APP {
	app!: FastCarApplication;
}

const appInstance = new APP();

describe("sql测试", () => {
	let mapper: TestMapper;
	let service: SimpleService;
	let transactionalService: TestTransactional;
	let dsService: TestDS;

	async function resetTestTable() {
		await mapper.execute("TRUNCATE TABLE test RESTART IDENTITY");
	}

	async function seedBaseRows() {
		await resetTestTable();
		await service.saveOne();
		await service.saveList();
	}

	before(() => {
		mapper = appInstance.app.getComponentByTarget<TestMapper>(TestMapper)!;
		service = appInstance.app.getComponentByTarget<SimpleService>(SimpleService)!;
		transactionalService = appInstance.app.getComponentByTarget<TestTransactional>(TestTransactional)!;
		dsService = appInstance.app.getComponentByTarget<TestDS>(TestDS)!;
	});

	after(async () => {
		await resetTestTable();
		appInstance.app.stopServer();
	});

	it("crud测试", async () => {
		await resetTestTable();

		let id = await service.saveOne();
		expect(id).to.equal(1);

		let saveListRes = await service.saveList();
		expect(saveListRes).to.equal(true);

		let updateOneRes = await service.updateOne();
		expect(updateOneRes).to.equal(true);

		let existRes = await service.exist();
		expect(existRes).to.equal(true);

		let countRes = await service.count();
		expect(countRes).to.equal(1);

		let queryListRes = await service.queryList();
		expect(queryListRes.length).to.equal(1);

		let updateByPrimaryKeyRes = await service.updateByPrimaryKey(id);
		expect(updateByPrimaryKeyRes).to.equal(true);

		let row = await mapper.selectByPrimaryKey(new Test({ id }));
		expect(row?.name).to.equal("hello world");
		expect(row?.list).to.deep.equal([{ a: 1 }, { b: 2 }]);
	});

	it("事务执行测试", async () => {
		await seedBaseRows();

		let batchRes = await transactionalService.exec();
		expect(batchRes).to.equal(true);

		let beforeRollbackRow = await mapper.selectByPrimaryKey(new Test({ id: 1 }));
		expect(beforeRollbackRow?.updateTime).to.equal(undefined);

		try {
			await transactionalService.work();
			expect.fail("work should rollback on invalid sql");
		} catch (e: any) {
			expect(e.message).to.contain("work exec fail");
		}

		let afterRollbackRow = await mapper.selectByPrimaryKey(new Test({ id: 1 }));
		expect(afterRollbackRow?.updateTime).to.equal(undefined);

		let rows = await mapper.select({
			where: {
				id: [1, 2],
			},
			orders: {
				id: "ASC" as any,
			},
		});
		expect(rows[0].flag).to.equal(false);
		expect(rows[1].flag).to.equal(false);
	});

	it("事务嵌套测试", async () => {
		await seedBaseRows();

		let res = await transactionalService.firstWork();
		expect(res).to.equal(true);

		let rows = await mapper.select({
			where: {
				id: [2, 3],
			},
		});
		expect(rows.length).to.equal(2);
		rows.forEach((item) => {
			expect(item.updateTime).to.be.instanceOf(Date);
		});
	});

	it("多数据源测试", async () => {
		await resetTestTable();

		let res = await dsService.switchDS();
		expect(res.length).to.equal(2);
		expect(res[0]?.caseName).to.contain("TEST1");
		expect(res[1]?.caseName).to.contain("TEST2");
	});

	it("数组测试", async () => {
		await seedBaseRows();

		let res = await service.queryIds();
		expect(res?.length).to.equal(2);
		expect(res?.map((item) => item.id)).to.deep.equal([2, 3]);
	});

	it("调用方法测试", async () => {
		await seedBaseRows();

		let res = await service.callFunction();
		expect(res.length).to.equal(1);
		expect(res[0].id).to.equal(3);
	});

	it("强制索引测试", async () => {
		await seedBaseRows();

		let res = await service.forceIndex();
		expect(res.length).to.equal(1);
		expect(res[0].id).to.equal(3);
	});

	it("函数测试", async () => {
		await seedBaseRows();

		let res = await service.testFormat();
		expect(res.length).to.equal(1);
		expect(res[0].createTimeText).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
	});

	it("连接测试", async () => {
		await seedBaseRows();

		let res = await service.testLeftJoin();
		expect(res.length).to.equal(3);
		expect(res[0]).to.have.property("otherName");
	});
});
