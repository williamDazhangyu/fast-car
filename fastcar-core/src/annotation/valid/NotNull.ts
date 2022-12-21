import AddChildValid from "./AddChildValid";

//是否为非空字段
export default function NotNull(target: any, propertyKey: string, index?: number) {
	AddChildValid(target, propertyKey, { required: true }, index);
}
