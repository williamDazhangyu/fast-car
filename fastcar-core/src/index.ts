import Application from "./annotation/Application";
import Autowired from "./annotation/Autowired";
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
import { ComponentKind } from "./constant/ComponentKind";
import { LifeCycleModule } from "./constant/LifeCycleModule";
import FastCarApplication from "./FastCarApplication";

const annotation = {
	ENV,
	ApplicationStart,
	ApplicationStop,
	ComponentScan,
	ComponentScanExclusion,
	Component,
	Configure,
	Controller,
	Service,
	Injection,
	Application,
	Autowired,
	ExceptionMonitor,
	Deprecate,
	NotImplemented,
	Override,
	Readonly,
};

export { LifeCycleModule, ComponentKind, FastCarApplication };
//注解暴露出去
export { annotation };
