import { MethodType } from "./src/type/MethodType";

import * as Koa from "koa";

type Ret = (target: any) => void;

type MRet = (target: any, name: string, descriptor: PropertyDescriptor) => void;

type MiddleWareType = (...args: any) => Koa.Middleware | Koa.Middleware[];

//关于请求方式注解
export function AddMapping(target: any, info: MethodType): void;

export function AllMapping(url?: string): MRet;

export function DeleteMapping(url?: string): MRet;

export function GetMapping(url?: string): MRet;

export function PostMapping(url?: string): MRet;

export function PatchMapping(url?: string): MRet;

export function PutMapping(url?: string): MRet;

export function RequestMapping(url: string): MRet;

export function ALL(url?: string): MRet;

export function DELETE(url?: string): MRet;

export function GET(url?: string): MRet;

export function POST(url?: string): MRet;

export function PATCH(url?: string): MRet;

export function PUT(url?: string): MRet;

export function REQUEST(url?: string): MRet;

//开启koa应用
export function EnableKoa(target: any): void;

//中间件添加拓展
export function KoaMiddleware(...args: MiddleWareType[]): Ret;
