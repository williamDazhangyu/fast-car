import "reflect-metadata";
import { PGBOSS_SCHEDULE_METADATA } from "../constant/PgBossMetaData";
import { PgBossData, PgBossScheduleOptions, PgBossSendOptions } from "../type/PgBossConfig";
import { PgBossScheduleMeta } from "../type/PgBossAnnotation";

export default function PgBossSchedule(
	queue: string,
	cron: string,
	options?: PgBossScheduleOptions & {
		source?: string;
		data?: PgBossData;
		sendOptions?: PgBossSendOptions;
	}
) {
	return function(target: object, methodName: string, descriptor: PropertyDescriptor) {
		let list: PgBossScheduleMeta[] = Reflect.getMetadata(PGBOSS_SCHEDULE_METADATA, target) || [];
		list.push({
			queue,
			cron,
			methodName,
			source: options?.source,
			data: options?.data,
			sendOptions: options?.sendOptions,
			options: cleanOptions(options, ["source", "data", "sendOptions"]),
		});
		Reflect.defineMetadata(PGBOSS_SCHEDULE_METADATA, list, target);
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
