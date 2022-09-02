import Controller from "../../../../src/annotation/stereotype/Controller";
import AliasInjection from "../../../../src/annotation/bind/AliasInjection";
import Autowired from "../../../../src/annotation/bind/Autowired";

@Controller
export default class NotFoundController {
	@AliasInjection("notFound")
	private notFound!: never;

	@Autowired
	private autoNotFound!: never;

	getNotFound() {
		return this.notFound;
	}

	getAutoNotFound() {
		return this.autoNotFound;
	}
}
