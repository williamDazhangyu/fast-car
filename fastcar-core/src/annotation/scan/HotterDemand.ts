import "reflect-metadata";
import Hotter from "./Hotter";
import { FastCarMetaData } from "../../constant/FastCarMetaData";

export default function HotterDemand(fp: string) {
	return function (target: any) {
		Hotter(target);
		Reflect.defineMetadata(FastCarMetaData.HotterFilePath, fp, target.prototype);
	};
}
