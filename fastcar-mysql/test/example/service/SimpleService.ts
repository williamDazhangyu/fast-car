import { Autowired, Service } from "fastcar-core/annotation";
import TestMapper from "../mapper/TestMapper";

@Service
class SimpleService {
	@Autowired
	myMapper!: TestMapper;

	constructor() {}

	//这边加一个代理用于拦截实现连接的方法
	async query() {
		let res = await this.myMapper.selectOne({
			where: {
				name: {
					value: "123",
					innerJoin: ">=",
					outerJoin: "AND",
				},
			},
		});
		return res;
	}
}

export default SimpleService;
