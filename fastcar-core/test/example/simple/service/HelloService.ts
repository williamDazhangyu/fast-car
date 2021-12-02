import Service from "../../../../src/annotation/stereotype/Service";

@Service
class HelloService {
	say() {
		console.info("hello world");
	}
}

export default HelloService;
