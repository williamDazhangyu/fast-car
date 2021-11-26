import { ComponentKind } from "../../constant/ComponentKind";
import Injection from "./Injection";

//中间服务层
export default function Service(target: any) {
	Injection(target, ComponentKind.Service);
}
