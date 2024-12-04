export interface ClassConstructor<Object> {
	new (): Object;

	new (...args: any[]): Object;
}
