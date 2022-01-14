import EnableKoa from "./annotation/EnableKoa";
import KoaMiddleware from "./annotation/KoaMiddleware";
import AddMapping from "./annotation/router/AddMapping";
import AllMapping from "./annotation/router/AllMapping";
import DeleteMapping from "./annotation/router/DeleteMapping";
import GetMapping from "./annotation/router/GetMapping";
import PatchMapping from "./annotation/router/PatchMapping";
import PostMapping from "./annotation/router/PostMapping";
import PutMapping from "./annotation/router/PutMapping";
import RequestMapping from "./annotation/router/RequestMapping";

export {
	//关于请求方式注解
	AddMapping,
	AllMapping,
	DeleteMapping,
	GetMapping,
	PatchMapping,
	PostMapping,
	PutMapping,
	RequestMapping,
	//开启koa应用
	EnableKoa,
	//追加koa中间件
	KoaMiddleware,
};
