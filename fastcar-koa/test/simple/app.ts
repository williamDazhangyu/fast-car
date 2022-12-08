import { FastCarApplication } from "@fastcar/core";
import { Application } from "@fastcar/core/annotation";
import EnableKoa from "../../src/annotation/EnableKoa";
import KoaMiddleware from "../../src/annotation/KoaMiddleware";
import KoaStatic from "../../src/middleware/KoaStatic";
import KoaBodyParser from "../../src/middleware/KoaBodyParser";
import * as Koa from "koa";
import ExceptionGlobalHandler from "../../src/middleware/ExceptionGlobalHandler";
import KoaCors from "../../src/middleware/koaCors";
import Swagger from "../../src/middleware/Swagger";

const m1 = () => {
	return async (ctx: any, next: Function) => {
		console.log("m1--- in");
		await next();
		console.log("m1--- out");
	};
};

const m2 = (): Koa.Middleware => {
	return async (ctx: any, next: Function) => {
		console.log("m2--- in");
		await next();
		console.log("m2--- out");
	};
};

@Application
@EnableKoa //开启koa
@KoaMiddleware(ExceptionGlobalHandler, KoaStatic, KoaBodyParser)
@KoaMiddleware(KoaCors)
@KoaMiddleware(Swagger)
@KoaMiddleware(m1, m2)
class APP {
	app!: FastCarApplication;
}

export const app = new APP();
