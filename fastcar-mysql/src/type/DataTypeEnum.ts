export enum DataTypeEnum {
	tinyint = "boolean", //这边做一个约定为tinyint的时候为boolean类型
	smallint = "number",
	mediumint = "number",
	int = "number",
	integer = "number",
	bigint = "number",
	float = "number",
	double = "number",
	decimal = "number",

	date = "Date",
	time = "string",
	year = "string",
	datetime = "Date",
	timestamp = "Date",

	char = "string",
	varchar = "string",
	tinyblob = "string",
	tinytext = "string",
	blob = "string",
	text = "string",
	mediumblob = "string",
	mediumtext = "string",
	longblob = "string",
	longtext = "string",
}
