export type MapperType = {
	name: string; //量变名称
	type: string; //类型
	field: string; //数据库列名
	dbType: string; //数据类型
	primaryKey?: boolean; //是否为主键 默认为false
	serialize?: Function; //序列化对象方法
	isSerial: boolean; //是否为自增的
};
