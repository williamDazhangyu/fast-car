type Ret = (target: any) => void;

type FRet = (target: any, methodName?: string, descriptor?: PropertyDescriptor) => void;

type PRet = (target: any, propertyKey: string, index?: number) => void;

type MRet = (target: any, methodName: string, descriptor: PropertyDescriptor) => void;

type PPRet = (target: any, method: string, index: number) => void;

declare interface Log4jsConfig {
	appenders: { [name: string]: any };
	categories: { [name: string]: { appenders: string[]; level: string; enableCallStack?: boolean } };
	pm2?: boolean;
	pm2InstanceVar?: string;
	levels?: any;
	disableClustering?: boolean;
}

type SizeModel = {
	minSize?: number;
	maxSize?: number;
};

type checkfun = (val: any) => boolean;

import { FormRuleModel } from "./src/model/FormRuleModel";

/**
 * 设置初始化的env 注入在原始的application上面
 */
export function ENV(name: string): Ret;

/***
 * 应用启动注解类
 * @params order 排序 序号越小排在越前面 系统级的组件 如数据库等一般为0 默认为1
 * @params exec 执行方法 默认函数名为run
 */
export function ApplicationStart(order?: number, exec?: string): Ret;
export function ApplicationStop(order?: number, exec?: string): Ret;

/***
 * 组件模块扫描类
 */
export function ComponentScan(...names: string[]): Ret;
export function ComponentScanExclusion(...names: string[]): Ret;

/***
 * 用于描述不同组件的作用类
 */
export function Component(target: any): void;
export function Configure(target: any): void;
export function Controller(target: any): void;
export function Service(target: any): void;
export function Repository(target: any): void;

//此方法用来构造不同的注入，不建议直接用于注解上
export function Injection(target: any, name: string): void;

//应用注解类
export function Application(target: any): any;

//用于自身手动包装注入方法
export function AddRequireModule(target: any, m: string, alias: string): void;

//自动注入类
export function Autowired(target: any, propertyKey: string): void;

//异常方法类
export function ExceptionMonitor(target: any): void;

//用于标记废弃
export function Deprecate(msg: string): void;

//标记为未实现
export function NotImplemented(target: any, name?: string, descriptor?: PropertyDescriptor): void;

//用于声明是否被重载了
export function Override(target: any, name?: string, descriptor?: PropertyDescriptor): void;

//用于标记是否只读
export function Readonly(target: any, name?: string, descriptor?: PropertyDescriptor): void;

//用于打印日志
//默认配置
// appenders: {
// 		sysLogger: {
// 			type: "console",
// 		},
// 	},
// categories: { default: { appenders: ["sysLogger"], level: "ALL" } },
export function Log(config?: Log4jsConfig): Ret;

//用于手动注入组件
export function SpecifyCompent(m: Function): Ret;

//动态数据源标记
export function DS(name: string): FRet;

//指定数据源标记位置
export function DSIndex(target: any, name: string, index: number): void;

//添加子表单校验数据
export function AddChildValid(target: any, name: string, value: { [key: string]: any }, index?: number): void;

//默认值放入
export function DefaultVal(val: any): PRet;

//非空字段校验
export function NotNull(target: any, propertyKey: string, index?: number): void;

export function Size(m: SizeModel): PRet;

//主要用于获取非基本类型的校验
export function Type(type: string): PRet;

export function ValidCustom(fn: checkfun, message?: string): PRet;

/***
 * @version 1.0 校验表单 支持校验大小 类型 和自定义方法
 */
export function ValidForm(target: any, methodName: string, descriptor: PropertyDescriptor): void;

/***
 *@version 1.0 添加校验规则 type如果不填选择为增强型的类型 若获取不到则为string校验
 *
 */
export function Rule(rules?: { [prop: string]: FormRuleModel }): PPRet;
