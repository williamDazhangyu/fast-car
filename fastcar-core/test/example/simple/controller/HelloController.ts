import { Autowired } from "../../../../src/annotation/Autowired";
import Controller from "../../../../src/annotation/stereotype/Controller";
import HelloService from "../service/HelloService";


@Controller
class HelloController {

    @Autowired
    private helloService!:HelloService;

    callHello() {

        this.helloService.say();
    }
}

export default HelloController;