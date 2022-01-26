import { FastCarMetaData } from "../../constant/FastCarMetaData";

//应用别名声明
export default function BeanName(name: string) {
	return function(target: any) {
		//生成别名 用于逻辑识别
		Reflect.defineMetadata(FastCarMetaData.Alias, name, target); //放入至原型中
	};
}
