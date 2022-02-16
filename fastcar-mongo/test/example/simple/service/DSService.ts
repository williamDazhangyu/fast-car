import { Autowired, Service } from "fastcar-core/annotation";
import Test2Mapper from "../mapper/Test2Mapper";
import TestMapper from "../mapper/TestMapper";
import Test from "../model/Test";

@Service
export default class DSService {
	@Autowired
	private testMapper!: TestMapper;

	@Autowired
	private test2Mapper!: Test2Mapper;

	async switchDS() {
		let d1 = new Test({ name: "first ds" });
		let d2 = new Test({ name: "second ds" });

		await this.testMapper.saveOne(d1);
		await this.test2Mapper.saveOne(d2);

		let db1 = await this.testMapper.selectByPrimaryKey(d1);
		let db2 = await this.test2Mapper.selectByPrimaryKey(d2);

		console.log("datasource1---", db1?.name);
		console.log("datasource2---", db2?.name);
	}
}
