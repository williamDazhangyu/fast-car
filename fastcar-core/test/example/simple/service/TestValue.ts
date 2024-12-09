import { DemandInjection, AppEnv, Value } from "../../../../src/annotation";
import HelloConfig from "../config/HelloConfig";

@DemandInjection
export default class TestValue {
	@Value("sys.test.a")
	a!: any;

	@Value("sys.test.a.b")
	b!: any;

	@Value("sys.test.a.b.c")
	c!: any;

	@AppEnv
	env!: string;

	@Value("a.b.c", HelloConfig)
	hello_c!: string;
}
