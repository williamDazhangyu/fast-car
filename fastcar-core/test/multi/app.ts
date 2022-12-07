import { Application, Autowired } from "../../src/annotation";
import FastCarApplication from "../../src/FastCarApplication";
import CService from "./service/cService";

@Application
class APP {
	@Autowired
	app!: FastCarApplication;
}

let instance = new APP();
setTimeout(() => {
	let c: CService = instance.app.getComponentByTarget(CService);
	c.test();
}, 1000);
