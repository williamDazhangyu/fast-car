import * as assert from "assert";
import { FastCarApplication } from "@fastcar/core";
import { Application, BaseFilePath, BasePath } from "@fastcar/core/annotation";
import EnableCache from "../../src/annotation/EnableCache";
import { EnableMysql } from "@fastcar/mysql/annotation";

@Application
@BasePath(__dirname) //直接运行ts文件时可不用
@BaseFilePath(__filename)
@EnableCache
@EnableMysql
class APP {
	app!: FastCarApplication;
}

let appInsatcne = new APP();

import CacheApplication from "../../src/CacheApplication";
let cacheApplication: CacheApplication = appInsatcne.app.getComponentByTarget(CacheApplication);

describe("缓存实例", () => {
	it("无持久化缓存示例", () => {
		//放入基本数据
		cacheApplication.set("noclientStore", "hello", "world");
		let world = cacheApplication.get("noclientStore", "hello");
		assert(world == "world");
	});

	it("无持久化过期key示例", () => {
		//放入基本数据
		cacheApplication.set("noclientStore", "hellottl", "worldttl", { ttl: 2 }); //2秒后消失
		//两秒判断是否存在key
		setTimeout(() => {
			assert(!cacheApplication.has("noclientStore", "hellottl")); //可能会有100ms左右延迟
		}, 2200);
	});

	it("本地文件缓存示例", () => {
		cacheApplication.set("fileStore", "hello", "world", { flush: true }); //快速存储
		cacheApplication.set("fileStore", "hello", "worldss"); //同步后存储
	});

	it("mysql数据库缓存示例", () => {
		cacheApplication.set("mysqlStore", "hello", "world"); //快速存储
	});
});
