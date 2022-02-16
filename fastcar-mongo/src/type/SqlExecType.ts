export type OperationSet = {
	method: string;
	args: any[];
};

export type SqlExecType = {
	ds?: string;
	params: OperationSet[];
};
