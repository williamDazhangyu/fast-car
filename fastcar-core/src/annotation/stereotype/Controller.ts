import { ComponentKind } from "../../constant/ComponentKind";
import Injection from "./Injection";

//业务逻辑层
export default function Controller(target: any) {
	Injection(target, ComponentKind.Controller);
}
