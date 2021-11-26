import { ComponentKind } from "../../constant/ComponentKind";
import Injection from "./Injection";

export default function Component(target: any) {
	Injection(target, ComponentKind.Component);
}
