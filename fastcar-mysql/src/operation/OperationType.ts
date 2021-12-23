export enum InnerJoinEnum {
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

export enum OuterJoinEnum {
	and = "AND",
	or = "OR",
}

export enum OrderEnum {
	asc = "ASC",
	desc = "DESC",
}

export type SqlWhere = {
	[key: string]: {
		value: number | string | number[] | string[] | null;
		innerJoin?: InnerJoinEnum | string; //内部连接
		outerJoin?: OuterJoinEnum | string; //各个条件拼凑
	};
};

export type OrderType = { [key: string]: OrderEnum | string };

export type SqlDelete = {
	where?: SqlWhere; //查询条件
	limit?: number; //限制行数
	offest?: number; //偏移量
};

export type SqlConditions = {
	where?: SqlWhere; //查询条件
	fields?: string[]; //查询出来的元素
	groups?: OrderType; //分组排序
	orders?: OrderType; //排序
	limit?: number; //限制行数
	offest?: number; //偏移量
	row?: Object; //待更新的行数据
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
	row: Object;
	limit?: number; //限制行数
	offest?: number; //偏移量
};
