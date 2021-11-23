

import { InstanceKind } from "../../constant/InstanceKind";
import SetInstanceKind from "./SetInstanceKind";

export default function Component(target: any) {

    SetInstanceKind(target, InstanceKind.Component);
}