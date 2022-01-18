export type MapperType = {
	name: string; //变量名称
	type: string; //类型
	field: string; //数据库列名
	dbType: string; //数据类型
	primaryKey?: boolean; //是否为主键 默认为false
	serialize?: Function; //序列化对象方法
};
