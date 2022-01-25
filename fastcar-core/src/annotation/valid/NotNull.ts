import AddChildValid from "./AddChildValid";
import ValidationUtil from "../../utils/ValidationUtil";

//是否为非空字段
export default function NotNull(target: any, propertyKey: string, index?: number) {
	AddChildValid(target, propertyKey, { required: true }, index);
}
