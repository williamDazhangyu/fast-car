import { ComponentKind } from "../../constant/ComponentKind";
import Injection from "./Injection";

//数据逻辑层(表明和数据库相关)
export default function Repository(target: any) {
	Injection(target, ComponentKind.Repository);
}
