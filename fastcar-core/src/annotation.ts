import Application from "./annotation/Application";
import Autowired from "./annotation/bind/Autowired";
import ENV from "./annotation/env/ENV";
import ExceptionMonitor from "./annotation/ExceptionMonitor";
import ApplicationStart from "./annotation/lifeCycle/ApplicationStart";
import ApplicationStop from "./annotation/lifeCycle/ApplicationStop";
import Deprecate from "./annotation/property/Deprecate";
import NotImplemented from "./annotation/property/NotImplemented";
import Override from "./annotation/property/Override";
import Readonly from "./annotation/property/Readonly";
import ComponentScan from "./annotation/scan/ComponentScan";
import ComponentScanExclusion from "./annotation/scan/ComponentScanExclusion";
import Component from "./annotation/stereotype/Component";
import Configure from "./annotation/stereotype/Configure";
import Controller from "./annotation/stereotype/Controller";
import Injection from "./annotation/stereotype/Injection";
import Service from "./annotation/stereotype/Service";
import Repository from "./annotation/stereotype/Repository";
import AddRequireModule from "./annotation/bind/AddRequireModule";
import DS from "./annotation/data/DS";
import DSIndex from "./annotation/data/DSIndex";
import AddChildValid from "./annotation/valid/AddChildValid";
import DefaultVal from "./annotation/valid/DefaultVal";
import NotNull from "./annotation/valid/NotNull";
import Size from "./annotation/valid/Size";
import Type from "./annotation/valid/Type";
import ValidCustom from "./annotation/valid/ValidCustom";
import ValidForm from "./annotation/valid/ValidForm";
import { Rule } from "./annotation/valid/Rule";
import BeanName from "./annotation/stereotype/BeanName";
import ComponentInjection from "./annotation/scan/ComponentInjection";
import DBType from "./annotation/data/DBType";
import Field from "./annotation/data/Field";
import PrimaryKey from "./annotation/data/PrimaryKey";
import Table from "./annotation/data/Table";
import Entity from "./annotation/data/Entity";
import SqlSession from "./annotation/data/SqlSession";
import Transactional from "./annotation/data/Transactional";
import Log from "./annotation/stereotype/Log";
import BaseFilePath from "./annotation/env/BaseFilePath";
import BasePath from "./annotation/env/BasePath";
import CallDependency from "./annotation/bind/CallDependency";
import Hotter from "./annotation/scan/Hotter";
import ApplicationRunner from "./annotation/lifeCycle/ApplicationRunner";
import ApplicationInit from "./annotation/lifeCycle/ApplicationInit";
import ApplicationDestory from "./annotation/lifeCycle/ApplicationDestory";
import ApplicationSetting from "./annotation/env/ApplicationSetting";
import AliasInjection from "./annotation/bind/AliasInjection";
import ResourcePath from "./annotation/env/ResourcePath";

//注解暴露出去
export {
	ApplicationStart,
	ApplicationStop,
	ApplicationRunner,
	ApplicationInit,
	ApplicationDestory,
	ComponentScan,
	ComponentScanExclusion,
	Component,
	ComponentInjection,
	Hotter,
	BeanName,
	Configure,
	Controller,
	Service,
	Repository,
	Injection,
	Application,
	Autowired,
	CallDependency,
	AliasInjection,
	ExceptionMonitor,
	Deprecate,
	NotImplemented,
	Override,
	Readonly,
	Log,
	AddRequireModule,
	AddChildValid,
	DefaultVal,
	NotNull,
	Size,
	Type,
	ValidCustom,
	ValidForm,
	Rule,
	ResourcePath,
};

export {
	DS,
	DSIndex,
	DBType, //数据库类型
	Field, //数据库字段名
	PrimaryKey, //是否为主键
	Table, //表名
	Entity, //表和对应编程内的类型映射
	SqlSession, //连接会话 如果需要使用同一连接或者使用事务是传递
	Transactional, //事务管理
};

export { ENV, BaseFilePath, BasePath, ApplicationSetting };
