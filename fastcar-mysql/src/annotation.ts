import EnableMysql from "./annotation/EnableMysql";
import Entity from "./annotation/Entity";
import DBType from "./annotation/mapper/DBType";
import Field from "./annotation/mapper/Field";
import PrimaryKey from "./annotation/mapper/PrimaryKey";
import SqlSession from "./annotation/SqlSession";
import Table from "./annotation/Table";
import Transactional from "./annotation/Transactional";

export {
	DBType, //数据库类型
	Field, //数据库字段名
	PrimaryKey, //是否为主键
	Table, //表名
	Entity, //表和对应编程内的类型映射
	SqlSession, //连接会话 如果需要使用同一连接或者使用事务是传递
	Transactional, //事务管理
	EnableMysql, //开启mysql组件
};
