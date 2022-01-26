import { Controller } from "../../../../src/annotation";
import BeanName from "../../../../src/annotation/stereotype/BeanName";

@Controller
@BeanName("controller1")
export default class AliasController {}
