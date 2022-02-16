export enum OperatorEnumMapping {
	"=" = "$eq",
	"!=" = "$ne",
	">" = "$gt",
	">=" = "$gte",
	"<" = "$lt",
	"<=" = "$lte",
	"LIKE" = "$regex",
	"IN" = "$in",
	"ISNULL" = "null",
	"ISNOTNULL" = "isNotNull",
	"+" = "$add", //累加
	"-" = "$subtract", //累减
	"*" = "$multiply", //累乘
	"/" = "$divide", //累除
}
