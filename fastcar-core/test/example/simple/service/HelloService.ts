import { Hotter } from "../../../../src/annotation";
import Service from "../../../../src/annotation/stereotype/Service";

@Hotter
@Service
class HelloService {
	say() {
		console.info("hello world");
	}
}

export default HelloService;
