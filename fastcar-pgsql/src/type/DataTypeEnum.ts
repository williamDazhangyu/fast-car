export enum DataTypeEnum {
	integer = "number",
	smallint = "number",
	bigint = "number",

	decimal = "number",
	numeric = "number",

	real = "number",
	double = "number",

	money = "string",

	char = "string",
	varchar = "string",
	text = "string",

	bytea = "Buffer",

	boolean = "boolean",
	timestamp = "Date",

	"timestamp without time zone" = "Date", //不带时区的时间戳
	"timestamp with time zone" = "Date", //带时区的时间戳
	"interval" = "string",

	"character" = "string",

	json = "any",
	jsonb = "any",
	uuid = "string",
	enum = "string",

	inet = "string", //网络ip
	cidr = "string",
	macaddr = "string",
}
