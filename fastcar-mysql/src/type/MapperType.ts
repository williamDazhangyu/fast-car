export type MapperType = {
	name: string; //变量名称
	tsType: string; //ts类型
	field: string; //数据库列名
	dbType: string; //数据类型
	maxLength?: number; //最大长度 当为字符串或者整型时传递
	notNULL?: boolean; //是否为空 默认为空
	primaryKey?: boolean; //是否为主键 默认为false
};
