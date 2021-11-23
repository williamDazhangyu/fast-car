
import { InstanceKind } from "../../constant/InstanceKind";
import SetInstanceKind from "./SetInstanceKind";

//业务逻辑层
export default function Controller(target: any) {

    SetInstanceKind(target, InstanceKind.Controller);
}