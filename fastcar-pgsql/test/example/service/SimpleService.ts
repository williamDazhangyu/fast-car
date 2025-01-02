import { Autowired, Service } from "@fastcar/core/annotation";
import { OrderEnum } from "@fastcar/core/db";
import TestMapper from "../mapper/TestMapper";
import Test from "../model/Test";
import { DateUtil } from "../../../../fastcar-core/src/utils";

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
		let test = new Test({ name: "ABC", caseName: "abc" });
		let res = await this.myMapper.saveORUpdate(test);
		return res;
	}

	//添加
	async saveOne() {
		let test = new Test({ name: "aaa", createTime: new Date(), money: "10", list: [{ a: 1 }, { b: 2 }] });
		// this.myMapper.setTableName("test2");
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
		let row = { name: "ABCD" };
		let res = await this.myMapper.updateOne({
			row,
			orders: {
				id: OrderEnum.asc,
			},
		});
		return res;
	}

	async updateByPrimaryKey() {
		let test = new Test({ id: 1, name: "hello world" });
		let res = await this.myMapper.updateByPrimaryKey(test);
		return res;
	}

	async selectOne() {
		let nowTime = DateUtil.toDateTime();

		let res = await this.myMapper.selectOne({
			where: {
				// AND: {
				name: "aaa",
				createTime: { "<=": nowTime },
				// },
			},
		});
		return res;
	}

	async exist() {
		let res = await this.myMapper.exist({
			name: "ABCD",
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
				id: 1,
			},
			orders: {
				id: OrderEnum.desc,
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

	//测试函数名的转义
	async callFunction() {
		return await this.myMapper.select({
			fields: ["MAX(id) as id"],
		});
	}

	//测试索引信息
	async forceIndex() {
		return await this.myMapper.select({
			forceIndex: ["caseTime"],
			orders: { caseTime: OrderEnum.desc },
			limit: 1,
		});
	}

	//使用函数测试
	async testFormat() {
		return await this.myMapper.select({
			fields: ['DATE_FORMAT( case_time, "%Y-%m-%d %H:%I:%s" ) as caseTime'],
		});
	}

	//使用数组
	async queryArray() {
		return await this.myMapper.select({
			where: {
				id: {
					IN: [2, 3],
				},
			},
		});
	}

	//测试左连接
	async testLeftJoin() {
		let res = await this.myMapper.selectByCustom({
			join: [
				{
					type: "LEFT",
					table: "cache c",
					on: "c.key = t.name",
				},
			],
			tableAlias: "t",
		});

		return res;
	}

	//测试json的查发
	async queryList() {
		//SELECT * FROM test WHERE () = 'hello'
		return await this.myMapper.select({
			where: {
				"list -> 'h' ->> 'hh'": "hello", //嵌套式搜索
			},
		});
	}
}

export default SimpleService;
