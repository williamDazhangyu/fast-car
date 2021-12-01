import { SqlWhere } from "./SqlWhere";

export type SqlUpdate = {
	where?: SqlWhere; //查询条件
	row: Object;
	limit?: number; //限制行数
	offest?: number; //偏移量
};
