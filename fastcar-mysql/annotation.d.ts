type Ret = (target: any) => void;

type PRet = (target: any, propertyKey: string) => void;

type FRet = (target: any, methodName?: string, descriptor?: PropertyDescriptor) => void;

export function DBType(name: string): PRet; //标记数据库类型

export function Field(name: string): PRet; //标记数据列名

export function MaxLength(length: number, scale?: number): PRet; //描述字段长度最大为多少

export function NotNull(target: any, propertyKey: string): void; //非空字段

export function PrimaryKey(target: any, propertyKey: string): void; //是否为主键

export function Table(name: string): Ret; //标记表名

export function Entity(className: Function): Ret; //映射实体类

export function DS(name: string): FRet; //动态数据源标记

export function DSIndex(target: any, name: string, index: number): void; //指定数据源标记位置

export function DSInjection(read?: boolean): FRet; //标记传参的数据源位置 read 默认为true

export function SqlSession(target: any, name: string, index: number): void; //连接会话 如果需要使用同一连接或者使用事务是传递

export function Transactional(target: any, methodName: string, descriptor: PropertyDescriptor): void; //开启事务

export function EnableMysql(target: any): void; //开启数据库功能
