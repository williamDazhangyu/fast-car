import "reflect-metadata";
import { FastCarMetaData } from "../..";

export default function Hotter(target: any) {
	Reflect.defineMetadata(FastCarMetaData.Hotter, true, target.prototype);
}
