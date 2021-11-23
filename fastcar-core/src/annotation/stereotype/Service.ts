
import { InstanceKind } from "../../constant/InstanceKind";
import SetInstanceKind from "./SetInstanceKind";

//中间服务层
export default  function Service(target: any) {

    SetInstanceKind(target, InstanceKind.Service);
}