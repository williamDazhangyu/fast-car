import { FastCarMetaData } from "@fastcar/core";
import KoaApplication from "../KoaApplication";

const koaApp = "koaApp";

/**
 * @version 1.0.0 获取koa-app方法
 */
export default function KoaApp(target: any, propertyKey: string) {
	Reflect.defineMetadata(
		FastCarMetaData.InjectionValue,
		[
			{
				key: koaApp,
				propertyKey: propertyKey,
				relayTarget: KoaApplication,
			},
		],
		target
	);
}
