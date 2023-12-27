import { Hotter } from "../../../../src/annotation";
import Configure from "../../../../src/annotation/stereotype/Configure";

@Hotter
@Configure("hello.yml")
class HotConfig {
	hello!: string;
}

export default HotConfig;
