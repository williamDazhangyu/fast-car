import "reflect-metadata";
import { FastCarMetaData, Logger } from "fastcar-core";
import { AddRequireModule } from "fastcar-core/annotation";
import MysqlDataSourceManager from "../dataSource/MysqlDataSourceManager";
import SqlError from "../type/SqlError";
import { DesignMeta } from "../type/DesignMeta";
import { FastCarApplication } from "fastcar-core";

/**
 * @version 1.0 事务管理 不建议多个事务的嵌套(避免长事务) 尽量做到一个方法一个事务
 * */
export default function Transactional(target: any, methodName: string, descriptor: PropertyDescriptor) {
	const orignFunction = descriptor.value;
	//注入app组件用于遍历组件
	AddRequireModule(target, FastCarMetaData.APP, FastCarMetaData.APP);

	//在初始化时就应该检测是否注入了sessionID
	const paramsIndex = Reflect.getOwnMetadata(DesignMeta.sqlSession, target, methodName);
	if (typeof paramsIndex != "number") {
		throw new SqlError(`${methodName} needs to inject the SqlSession`);
	}

	descriptor.value = async function (...args: any[]) {
		//创建会话id
		let app: FastCarApplication = Reflect.get(this, FastCarMetaData.APP);
		let sysLogger: Logger = app.getComponentByName("SysLogger");
		let dsm: MysqlDataSourceManager = app.getComponentByTarget(MysqlDataSourceManager);

		if (!dsm) {
			sysLogger.error(`MysqlDataSourceManager not found`);
			return Promise.reject(new SqlError(`MysqlDataSourceManager not found`));
		}

		let sessionId = args[paramsIndex];
		if (sessionId) {
			return Promise.resolve(Reflect.apply(orignFunction, this, args));
		}
		let errFlag = false;
		sessionId = dsm.createSession();
		args[paramsIndex] = sessionId;
		let res: any = null;

		return new Promise((resolve, reject) => {
			Reflect.apply(orignFunction, this, args)
				.then((result: any) => {
					res = result;
				})
				.catch((e: Error) => {
					sysLogger.error(e);
					errFlag = true;
				})
				.finally(async () => {
					await dsm.destorySession(sessionId, errFlag);
					return !errFlag ? resolve(res) : reject(new SqlError(`${methodName} exec fail `));
				});
		});
	};
}
