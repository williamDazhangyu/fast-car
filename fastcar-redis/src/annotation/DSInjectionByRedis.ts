import { FastCarMetaData } from "fastcar-core";
import { AddRequireModule } from "fastcar-core/annotation";
import "reflect-metadata";
import SqlError from "../type/SqlError";
import { FastCarApplication } from "fastcar-core";

//动态数据源注入
export default function DSInjectionByRedis(dataName: string = "default") {
	return function(target: any, name: string, descriptor: PropertyDescriptor) {
		AddRequireModule(target, FastCarMetaData.APP, FastCarMetaData.APP);

		const orignFunction = descriptor.value;
		//取出ds标记的位置 在编译前规避这个问题
		const dsIndex = Reflect.getMetadata(FastCarMetaData.DSIndex, target, name);
		if (typeof dsIndex != "number") {
			throw new SqlError(`${name} dynamic data source not found`);
		}

		descriptor.value = function(...args: any[]) {
			let dsName = args[dsIndex];
			if (!dsName) {
				let fnDefaultDS = Reflect.getMetadata(FastCarMetaData.DS, target, name);
				let classDefaultDS = Reflect.getMetadata(FastCarMetaData.DS, target);

				dsName = fnDefaultDS || classDefaultDS;
				if (!dsName) {
					let app: FastCarApplication = Reflect.get(this, FastCarMetaData.APP);
					let dsm: MysqlDataSourceManager = app.getComponentByName("MysqlDataSourceManager");
					dsName = dsm.getDefaultSoucre(read);
				}
				args[dsIndex] = dsName;
			}

			return Promise.resolve(Reflect.apply(orignFunction, this, args));
		};
	};
}