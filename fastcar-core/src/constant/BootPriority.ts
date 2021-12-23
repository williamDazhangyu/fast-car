export enum BootPriority {
	Base = 0, //一般系统级的会优先启动这一个
	Sys = 1, //系统优先的
	Common = 2, //常用
	Other = 3, //额外的
	Lowest = 10000, //默认优先级1万最低
}
