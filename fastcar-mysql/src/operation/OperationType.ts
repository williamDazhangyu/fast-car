export enum OperatorEnum {
	eq = "=",
	neq = "!=",
	gt = ">",
	gte = ">=",
	lt = "<",
	lte = "<=",
	like = "LIKE",
	in = "IN",
	isNUll = "ISNULL",
	isNotNull = "IS NOT NULL",
}

export enum JoinEnum {
	and = "AND",
	or = "OR",
}

export enum OrderEnum {
	asc = "ASC",
	desc = "DESC",
}

export type SqlValue = number | string | number[] | string[] | null;

export type SqlWhere = {
	[key: string]:
		| {
				value: number | string | number[] | string[] | null;
				operator?: OperatorEnum | string; //内部连接
				join?: JoinEnum | string; //各个条件拼凑
		  }
		| SqlValue;
};

export type RowData = {
	[key: string]: any;
};

export type OrderType = { [key: string]: OrderEnum | string };

export type SqlDelete = {
	where?: SqlWhere; //查询条件
	limit?: number; //限制行数
};

export type SqlQuery = {
	where?: SqlWhere; //查询条件
	fields?: string[]; //查询出来的元素
	groups?: OrderType; //分组排序
	orders?: OrderType; //排序
	limit?: number; //限制行数
	offest?: number; //偏移量
};

export type SqlUpdate = {
	where?: SqlWhere; //查询条件
	row: RowData;
	limit?: number; //限制行数
};
