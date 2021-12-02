import * as path from "path";
import FileUtil from "../../utils/FileUtil";
import MixTool from "../../utils/Mix";
import Component from "./Component";

//配置文件层
export default function Configure(name: string) {
	return function(target: any) {
		//配置对象也为组件
		Component(target);
		//当实例化时 加载默认配置并进行赋值
		let fp = path.join(require.main?.path || module.path, "resource", name);
		let tmpConfig = FileUtil.getResource(fp);

		console.log("加载配置", name);

		//进行实例化赋值
		if (tmpConfig) {
			//进行赋值不改变基础属性
			MixTool.copPropertyValue(target.prototype, tmpConfig);
		}
	};
}
