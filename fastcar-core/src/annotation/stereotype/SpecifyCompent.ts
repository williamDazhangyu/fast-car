import FastCarApplication from "../../FastCarApplication";

//加载特殊组件手动注入
export default function SpecifyCompent(m: Function) {
	return function(target: any) {
		FastCarApplication.setSpecifyCompent(m);
	};
}
