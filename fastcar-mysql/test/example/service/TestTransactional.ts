import { Autowired, Service } from "fastcar-core/annotation";
import SqlSession from "../../../src/annotation/SqlSession";
import Transactional from "../../../src/annotation/Transactional";
import MysqlDataSourceManager from "../../../src/dataSource/MysqlDataSourceManager";
import TestMapper from "../mapper/TestMapper";

@Service
class TestTransactional {
	@Autowired
	myMapper!: TestMapper;

	@Autowired
	private dsm!: MysqlDataSourceManager;

	async exec() {
		let sql = "update test set flag = 0 where id = 1 ";
		let sql2 = "update test set flag = 0 where id = 2";

		try {
			let res = await this.dsm.batchExecute([{ sql }, { sql: sql2 }]);
			return res;
		} catch (e) {
			return null;
		}
	}

	//必须是sessionId和Transactional配合使用，然后只有传入sessionId的执行语句才会生效
	@Transactional
	async work(@SqlSession sessionId?: string) {
		let res = await this.myMapper.updateOne(
			{
				where: { id: 1 },
				row: { case_time: new Date() },
			},
			sessionId
		);
		let sql2 = "select * from noExistTable";
		await this.myMapper.execute(sql2, [], sessionId);
		return res;
	}

	//并发执行 但切记不要一次并发太多导致导致并发连接数占用过多
	@Transactional
	async bacthExec(@SqlSession sessionId?: string) {
		let res = await Promise.all([
			this.myMapper.updateOne(
				{
					where: { id: 2 },
					row: { case_time: new Date() },
				},
				sessionId
			),
			this.myMapper.updateOne(
				{
					where: { id: 3 },
					row: { case_time: new Date() },
				},
				sessionId
			),
			this.myMapper.updateOne(
				{
					where: { id: 1 },
					row: { case_time: new Date() },
				},
				sessionId
			),
			// this.myMapper.execute("select * from noExistTable", [], sessionId),
		]);

		return res;
	}

	//嵌套执行
	@Transactional
	async firstWork(@SqlSession sessionId?: string) {
		await this.myMapper.updateOne(
			{
				where: { id: 2 },
				row: { case_time: new Date() },
			},
			sessionId
		);
		//调用嵌套的
		return await this.secondWork(sessionId);
	}

	@Transactional
	async secondWork(@SqlSession sessionId?: string) {
		let res = await this.myMapper.updateOne(
			{
				where: { id: 3 },
				row: { case_time: new Date() },
			},
			sessionId
		);
		return res;
	}
}

export default TestTransactional;
