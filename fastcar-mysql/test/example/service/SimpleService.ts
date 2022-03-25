import { Autowired, Service } from "fastcar-core/annotation";
import TestMapper from "../mapper/TestMapper";
import Test from "../model/Test";

@Service
class SimpleService {
	@Autowired
	myMapper!: TestMapper;

	constructor() {}

	//查询
	async query() {
		let res = await this.myMapper.selectOne({
			where: {
				name: {
					value: "hello",
				},
			},
		});
		return res;
	}

	//更新或者添加
	async saveUpdate() {
		let test = new Test({ name: "ABC", caseTime: new Date() });
		let res = await this.myMapper.saveORUpdate(test);
		return res;
	}

	//添加
	async saveOne() {
		let test = new Test({ name: "aaa", caseTime: new Date(), money: 100000000 });
		let res = await this.myMapper.saveOne(test);
		return res;
	}

	//批量添加
	async saveList() {
		let test = new Test({ name: "bbb" });
		let test2 = new Test({ name: "ccc" });

		let res = await this.myMapper.saveList([test, test2]);
		return res;
	}

	//更新
	async update() {
		let res = await this.myMapper.update({ where: { id: 1 }, row: { name: "ABCD" } });
		return res;
	}

	async updateOne() {
		let row = { name: "ABCDE" };
		let res = await this.myMapper.updateOne({ where: { id: 1 }, row });
		return res;
	}

	async updateByPrimaryKey() {
		let test = new Test({ id: 1, name: "1234" });
		let res = await this.myMapper.updateByPrimaryKey(test);
		return res;
	}

	async selectOne() {
		let res = await this.myMapper.selectOne({
			where: {
				// AND: {
				name: "aaa",
				caseTime: { ">=": "2022-01-11", "<=": "2022-02-12" },
				// },
			},
		});
		return res;
	}

	async exist() {
		let res = await this.myMapper.exist({
			name: "124",
		});
		return res;
	}

	async count() {
		let countNum = await this.myMapper.count({ id: 1 });
		return countNum;
	}

	async delete() {
		let res = await this.myMapper.delete({
			where: {
				name: "bbb",
			},
		});
		return res;
	}

	//操作一个错误的
	async opeatorError() {
		return await this.myMapper.execute("select * from noExistTable");
	}

	//数组测试
	async queryIds() {
		return await this.myMapper.select({ where: { id: [2, 3] } });
	}
}

export default SimpleService;
