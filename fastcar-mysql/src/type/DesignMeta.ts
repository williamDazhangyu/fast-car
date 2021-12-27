export enum DesignMeta {
	paramTypes = "design:paramtypes", //传参类型
	returnType = "design:returntype", //返回类型
	designType = "design:type", //设计类型
	table = "db:table", //表名
	field = "db:field", //列名
	fieldMap = "db:fieldMap", //注入列名集合
	dbType = "db:dbType", //数据类型
	primaryKey = "db:primaryKey", //主键类型
	maxLength = "db:maxLength", //最大长度
	notNull = "db:notNull", //不为空
	entity = "db:entity", //实例化的数据库类
	mapping = "db:mapping", //映射描述
	dbFields = "db:fields", //数据库名-ts名
	ds = "dynamicDataSource",
}
