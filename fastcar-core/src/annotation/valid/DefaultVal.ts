import AddChildValid from "./AddChildValid";

//默认值获取
export default function DefaultVal(val: any) {
	return function(target: any, propertyKey: string) {
		AddChildValid(target, propertyKey, { defaultVal: val });
	};
}
