import "reflect-metadata";
import { PGBOSS_WORK_METADATA } from "../constant/PgBossMetaData";
import { PgBossWorkOptions } from "../type/PgBossConfig";
import { PgBossWorkerMeta } from "../type/PgBossAnnotation";

export default function PgBossWork(queue: string, options?: PgBossWorkOptions & { source?: string; batch?: boolean }) {
	return function(target: object, methodName: string, descriptor: PropertyDescriptor) {
		let list: PgBossWorkerMeta[] = Reflect.getMetadata(PGBOSS_WORK_METADATA, target) || [];
		list.push({
			queue,
			methodName,
			source: options?.source,
			batch: options?.batch,
			options: cleanOptions(options, ["source", "batch"]),
		});
		Reflect.defineMetadata(PGBOSS_WORK_METADATA, list, target);
		return descriptor;
	};
}

function cleanOptions<T extends object>(options: T | undefined, excludes: string[]): Omit<T, keyof T> | T | undefined {
	if (!options) {
		return undefined;
	}

	let result = Object.assign({}, options);
	excludes.forEach((key) => Reflect.deleteProperty(result, key));
	if (Object.keys(result).length == 0) {
		return undefined;
	}

	return result;
}
