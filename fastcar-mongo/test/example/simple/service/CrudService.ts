import { Autowired, Service } from "fastcar-core/annotation";
import TestMapper from "../mapper/TestMapper";
import Test from "../model/Test";

@Service
class CrudService {
	@Autowired
	private testMapper!: TestMapper;

	async save() {
		let t = new Test({ name: "hello", caseTime: new Date() });
		let res = await this.testMapper.saveOne(t);
		return res;
	}

	async saveList() {
		let t = new Test({ name: "hello", caseTime: new Date() });
		let res = await this.testMapper.saveList([t, t]);
		return res;
	}

	async update() {
		let res = await this.testMapper.update({ row: { name: "world" }, where: { name: "hello" } });
		return res;
	}

	async updateOne() {
		let res = await this.testMapper.updateOne({ row: { name: "hello" }, where: { name: "world" } });
		return res;
	}

	async updateByPrimaryKey() {
		let t = new Test({ id: "620b4fb728872705561f0beb", caseTime: new Date() });
		let res = await this.testMapper.updateByPrimaryKey(t);
		return res;
	}

	async select() {
		let list = await this.testMapper.select({ where: { money: 1 } });
		return list;
	}

	async selectOne() {
		let t = await this.testMapper.selectOne({ where: { name: "world" } });
		return t;
	}

	async selectByPrimaryKey() {
		let t = new Test({ id: "620b4fb728872705561f0beb" });
		return await this.testMapper.selectByPrimaryKey(t);
	}

	async exist() {
		return await this.testMapper.exist({ name: "world" });
	}

	async count() {
		return await this.testMapper.count({ name: "world" });
	}

	async delete() {
		return await this.testMapper.delete({ name: "hello" });
	}

	async deleteOne() {
		return await this.testMapper.deleteOne({ name: "hello" });
	}

	async deleteByPrimaryKey() {
		let n = new Test({ id: "620c6ddac6a2e5794dac64e8" });
		return await this.testMapper.deleteByPrimaryKey(n);
	}
}

export default CrudService;
