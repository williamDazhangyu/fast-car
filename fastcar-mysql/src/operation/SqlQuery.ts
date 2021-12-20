import { SqlWhere } from "./SqlWhere";

export type SqlQuery = {
	where?: SqlWhere; //查询条件
	fields?: string[]; //查询出来的元素
	orders?: string[]; //排序
	limit?: number; //限制行数
	offest?: number; //偏移量
};
