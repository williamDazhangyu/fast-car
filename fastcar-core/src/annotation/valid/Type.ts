import AddChildValid from "./AddChildValid";

//表明类型
export default function Type(type: string) {
	return function(target: any, propertyKey: string) {
		AddChildValid(target, propertyKey, { type: type.toLowerCase() });
	};
}
