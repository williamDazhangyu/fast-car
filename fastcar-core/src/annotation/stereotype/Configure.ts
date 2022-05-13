import Component from "./Component";
import { LifeCycleModule } from "../../constant/LifeCycleModule";

//配置文件层
export default function Configure(name: string) {
	return function (target: any) {
		//配置对象也为组件
		Component(target);
		//当实例化时 加载默认配置并进行赋值
		Reflect.defineMetadata(LifeCycleModule.LoadConfigure, name, target);
	};
}
