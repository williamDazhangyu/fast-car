export enum DesignMeta {
	table = "db:table", //表名
	field = "db:field", //列名
	fieldMap = "db:fieldMap", //注入列名集合
	dbType = "db:dbType", //数据类型
	primaryKey = "db:primaryKey", //主键类型
	entity = "db:entity", //实例化的数据库类
	mapping = "db:mapping", //映射描述
	dbFields = "db:fields", //数据库名-ts名
	sqlSession = "SqlSession", //sql会话
}
