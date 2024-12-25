import "reflect-metadata";
import { FastCarMetaData } from "../..";
import Hotter from "./Hotter";

/**
 * @version 1.0 用于热更新的回调作用
 */
export default function HotterCallBack(fn: string) {
	return function (target: any) {
		Hotter(target);
		Reflect.defineMetadata(FastCarMetaData.HotterCallback, fn, target.prototype);
	};
}
