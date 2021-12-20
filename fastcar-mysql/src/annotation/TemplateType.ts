import { DesignMeta } from "../type/DesignMeta";

//这是一个模板类 代表具体的映射关系
export default function TemplateType(className: Function) {
	return function (target: any) {
		Reflect.defineMetadata(DesignMeta.templateType, className, target.prototype);
	};
}
