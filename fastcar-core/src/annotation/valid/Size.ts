import AddChildValid from "./AddChildValid";

type SizeModel = {
	minSize?: number;
	maxSize?: number;
};

//校验长度
export default function Size(m: SizeModel = { minSize: 0, maxSize: 0 }) {
	return function(target: any, propertyKey: string) {
		AddChildValid(target, propertyKey, m);
	};
}
