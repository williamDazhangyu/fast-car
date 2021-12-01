import FastCarApplication from "../FastCarApplication";
import MixTool from "../utils/Mix";

//基础服务的应用
export default function Application(target: any) {
	target = MixTool.mix(FastCarApplication, target);
	return target;
}
