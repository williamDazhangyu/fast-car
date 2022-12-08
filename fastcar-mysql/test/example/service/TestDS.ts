import { Autowired, Service } from "@fastcar/core/annotation";
import TestMapper from "../mapper/TestMapper";
import TestMapper2 from "../mapper/TestMapper2";
import Test from "../model/Test";

@Service
export default class TestDS {
	@Autowired
	myMapper!: TestMapper;

	@Autowired
	myMapper2!: TestMapper2;

	async switchDS() {
		await this.myMapper.saveOne(new Test({ name: "test", caseName: "数据源TEST1" }));
		await this.myMapper2.saveOne(new Test({ name: "test", caseName: "数据源TEST2" }));

		let result = await Promise.all([
			this.myMapper.selectOne({
				where: {
					name: "test",
				},
				fields: ["caseName"],
			}),
			this.myMapper2.selectOne({
				where: {
					name: "test",
				},
				fields: ["caseName"],
			}),
		]);

		return result;
	}
}
