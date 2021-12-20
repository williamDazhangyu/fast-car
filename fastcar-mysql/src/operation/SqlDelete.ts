import { SqlWhere } from "./SqlWhere";

export type SqlDelete = {
	where?: SqlWhere; //查询条件
	limit?: number; //限制行数
	offest?: number; //偏移量
};
