import { ComponentInjection } from "@fastcar/core/annotation";

//开启数据库功能
export default function EnableMongo(target: any) {
	//手动注入实例
	let fp = require.resolve("../dataSource/MongoDataSourceManager");
	ComponentInjection(target, fp);
}
