import Configure from "../../../../src/annotation/stereotype/Configure";

@Configure("hello.yml")
class HelloConfig {
	hello!: string;
}

export default HelloConfig;
