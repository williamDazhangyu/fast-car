export type ComponentDesc = {
	id: string;
	name: string;
	path: string;
	classZ: Function | Object;
};

//注入的类型
export enum InjectionType {
	PROPERTYKEY = "PROPERTYKEY",
	ALIAS = "ALIAS",
}

export type InjectionMeta = {
	key: string;
	kind: InjectionType;
	alias?: string;
};

export type InjectionValueMeta = {
	key: string;
	propertyKey: string;
	relayTarget?: Object;
};
